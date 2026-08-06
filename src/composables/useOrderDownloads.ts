import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import JsBarcode from 'jsbarcode'
import type { Order } from '@/types/order.types'
import type { DispatchOrderDetail } from '@/types/dispatch.types'
import type { SenderInfo } from '@/types/store.types'
import { useFormatters } from './useFormatters'

/**
 * Forma mínima que necesitan el Picking List y la Etiqueta de envío.
 *
 * Existe porque estos dos documentos se imprimen desde Pedidos y desde
 * Despacho, y cada módulo carga la orden de un endpoint distinto (`/orders/:id`
 * vs `/dispatch/orders/:id`). En vez de duplicar los generadores, cada vista
 * adapta su respuesta a esta forma con los `printableFrom*` de abajo.
 */
export interface PrintableItem {
  sku?: string
  name: string
  variant?: string | null
  quantity: number
}

export interface PrintableRecipient {
  name?: string
  phone?: string
  docType?: string
  docNumber?: string
  address?: string
  addressLine2?: string
  reference?: string
  district?: string
  province?: string
  department?: string
  ubigeoCode?: string
  latitude?: string
  longitude?: string
}

export interface PrintableOrder {
  orderNumber: string
  createdAt: string
  items: PrintableItem[]
  recipient: PrintableRecipient
  /** Nota que dejó el comprador en el checkout. */
  customerNote?: string
}

/** Adapta la respuesta de `/orders/:id` (módulo Pedidos). */
export function printableFromOrder(order: Order): PrintableOrder {
  const shipping = order.shipping_details
  let address = shipping?.address || ''
  if (!address && order.shipping_address) {
    address = typeof order.shipping_address === 'string'
      ? order.shipping_address
      : [order.shipping_address.street, order.shipping_address.city, order.shipping_address.state]
          .filter(Boolean).join(', ')
  }

  return {
    orderNumber: order.order_number,
    createdAt: order.created_at,
    items: order.items.map(item => ({
      sku: item.product_sku || undefined,
      name: item.product_name,
      quantity: item.quantity
    })),
    // El documento del envío manda sobre el de facturación: en una Factura el
    // primero guarda el DNI real de quien recibe y el segundo el RUC de la empresa.
    recipient: {
      name: shipping?.recipient_name || order.customer?.name,
      phone: shipping?.recipient_phone || order.customer?.phone,
      docType: shipping?.doc_number ? shipping.doc_type : order.customer?.document_type,
      docNumber: shipping?.doc_number || order.customer?.document_number,
      address,
      addressLine2: shipping?.address_line2,
      reference: shipping?.reference,
      district: shipping?.district,
      province: shipping?.province,
      department: shipping?.department,
      ubigeoCode: shipping?.ubigeo_code,
      latitude: shipping?.latitude,
      longitude: shipping?.longitude
    },
    customerNote: order.notes
  }
}

/**
 * El envío se lista aunque su costo sea 0 (envío gratis): omitirlo hacía
 * desaparecer la línea del comprobante y no quedaba claro si hubo despacho.
 * Se excluyen retiros en tienda y ventas POS sin dirección, donde no hubo envío.
 */
function hasShipping(order: Order): boolean {
  const cost = order.shipping_cost
  if (cost === null || cost === undefined) return false
  if (cost > 0) return true
  return Boolean(order.shipping_details?.address || order.shipping_details?.service_type)
}

/** Etiqueta del envío, incluyendo la tarifa elegida (Express, Mismo día, etc.). */
function shippingLabel(order: Order): string {
  const serviceType = order.shipping_details?.service_type
  return serviceType ? `Envío (${serviceType.name}):` : 'Envío:'
}

/** Adapta la respuesta de `/dispatch/orders/:id` (módulo Despacho). */
export function printableFromDispatch(order: DispatchOrderDetail): PrintableOrder {
  const shipping = order.shipping

  return {
    orderNumber: order.order_code,
    createdAt: order.order_date,
    items: order.items.map(item => ({
      sku: item.variant_sku || item.sku,
      name: item.name,
      variant: item.variant,
      quantity: item.quantity
    })),
    recipient: {
      name: shipping?.recipient_name || order.customer.name,
      phone: shipping?.recipient_phone || order.customer.phone,
      docType: shipping?.doc_type,
      docNumber: shipping?.doc_number,
      address: shipping?.address || order.delivery.address,
      addressLine2: shipping?.address_line2,
      reference: shipping?.reference,
      district: shipping?.district,
      province: shipping?.province,
      department: shipping?.department,
      ubigeoCode: shipping?.ubigeo_code,
      latitude: shipping?.latitude,
      longitude: shipping?.longitude
    },
    customerNote: order.observation
  }
}

/**
 * Code 128 real como data URL.
 *
 * Antes se dibujaban barras derivadas del código ASCII del número de pedido:
 * parecían un barcode pero ningún escáner las leía. Si la codificación falla se
 * devuelve null y la etiqueta sale sin barcode — mejor eso que uno falso que el
 * transportista descubre recién en el counter.
 */
function barcodeDataUrl(value: string): string | null {
  const content = value.trim()
  if (!content) return null

  try {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, content, {
      format: 'CODE128',
      displayValue: false,
      margin: 0,
      width: 2,
      height: 60
    })
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('No se pudo generar el código de barras:', error)
    return null
  }
}

/** Ubigeo en el formato que rotulan las agencias: "DISTRITO - PROVINCIA - DEPARTAMENTO". */
function locationLine(recipient: PrintableRecipient): string {
  return [recipient.district, recipient.province, recipient.department].filter(Boolean).join(' - ')
}

export function useOrderDownloads() {
  const { formatCurrency, formatDateTime } = useFormatters()

  const shippingAmount = (order: Order): string =>
    (order.shipping_cost ?? 0) > 0 ? formatCurrency(order.shipping_cost ?? 0) : 'Gratis'

  /**
   * Generate PDF document for an order
   */
  function downloadPDF(order: Order, storeName: string = 'Mi Tienda') {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(storeName, pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    // "Comprobante" es un término tributario reservado a boletas, facturas y
    // notas de crédito. Este PDF es un documento interno del pedido.
    doc.text('Pedido de Venta', pageWidth / 2, 28, { align: 'center' })

    // Order info box
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Pedido: ${order.order_number}`, 14, 45)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Fecha: ${formatDateTime(order.created_at)}`, 14, 52)

    // Status badge
    const statusText = getStatusText(order.status)
    doc.text(`Estado: ${statusText}`, pageWidth - 14, 45, { align: 'right' })

    // Customer info
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Datos del Cliente', 14, 65)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    let yPos = 72
    if (order.customer?.business_name) {
      doc.text(`Razón Social: ${order.customer.business_name}`, 14, yPos)
      yPos += 6
    }
    if (order.customer?.name) {
      doc.text(`Nombre: ${order.customer.name}`, 14, yPos)
      yPos += 6
    }
    if (order.customer?.document_number) {
      const docType = order.customer.document_type === '2' ? 'RUC' : 'DNI'
      doc.text(`${docType}: ${order.customer.document_number}`, 14, yPos)
      yPos += 6
    }
    if (order.customer?.email) {
      doc.text(`Email: ${order.customer.email}`, 14, yPos)
      yPos += 6
    }
    if (order.customer?.phone) {
      doc.text(`Teléfono: ${order.customer.phone}`, 14, yPos)
      yPos += 6
    }

    // Shipping info (right column)
    if (order.shipping_details) {
      doc.setFont('helvetica', 'bold')
      doc.text('Datos de Envío', pageWidth / 2 + 10, 65)
      doc.setFont('helvetica', 'normal')

      let yPosShip = 72
      if (order.shipping_details.recipient_name) {
        doc.text(`Destinatario: ${order.shipping_details.recipient_name}`, pageWidth / 2 + 10, yPosShip)
        yPosShip += 6
      }
      if (order.shipping_details.address) {
        const addr = order.shipping_details.address
        const lines = doc.splitTextToSize(addr, 80)
        doc.text(lines, pageWidth / 2 + 10, yPosShip)
        yPosShip += lines.length * 5
      }
      if (order.shipping_details.district || order.shipping_details.province) {
        const location = [
          order.shipping_details.district,
          order.shipping_details.province,
          order.shipping_details.department
        ].filter(Boolean).join(', ')
        doc.text(location, pageWidth / 2 + 10, yPosShip)
      }
    }

    // Products table
    const tableStartY = Math.max(yPos, 110)

    const tableData = order.items.map((item, index) => [
      (index + 1).toString(),
      item.product_sku || '-',
      item.product_name,
      item.quantity.toString(),
      formatCurrency(item.price),
      formatCurrency(item.subtotal)
    ])

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'SKU', 'Producto', 'Cant.', 'P. Unit.', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 178, 166], // Primary color
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    })

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10

    doc.setFontSize(10)
    const totalsX = pageWidth - 14

    // Subtotal
    if (hasShipping(order)) {
      const subtotal = order.total - (order.shipping_cost ?? 0) + (order.discount || 0)
      doc.text(`Subtotal: ${formatCurrency(subtotal)}`, totalsX, finalY, { align: 'right' })
    }

    // Shipping
    if (hasShipping(order)) {
      doc.text(`${shippingLabel(order)} ${shippingAmount(order)}`, totalsX, finalY + 6, { align: 'right' })
    }

    // Discount
    if (order.discount && order.discount > 0) {
      doc.text(`Descuento: -${formatCurrency(order.discount)}`, totalsX, finalY + 12, { align: 'right' })
    }

    // Total
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    const totalY = finalY + (hasShipping(order) || order.discount ? 22 : 6)
    doc.text(`TOTAL: ${formatCurrency(order.total)}`, totalsX, totalY, { align: 'right' })

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Documento generado desde el backoffice', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

    // Save
    doc.save(`pedido-${order.order_number}.pdf`)
  }

  /**
   * Generate Ticket PDF (80mm thermal printer format)
   */
  function downloadTicket(order: Order, storeName: string = 'Mi Tienda') {
    // 80mm = ~226 points, but we use 80mm format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // 80mm width, variable height
    })

    const pageWidth = 80
    const margin = 4
    let y = 10

    // Store name
    doc.setFontSize(12)
    doc.setFont('courier', 'bold')
    doc.text(storeName, pageWidth / 2, y, { align: 'center' })
    y += 8

    // Separator
    doc.setFontSize(8)
    doc.text(''.padStart(40, '-'), pageWidth / 2, y, { align: 'center' })
    y += 6

    // Order number
    doc.setFontSize(10)
    doc.setFont('courier', 'bold')
    doc.text(`VENTA: ${order.order_number}`, pageWidth / 2, y, { align: 'center' })
    y += 5
    doc.setFont('courier', 'normal')
    doc.setFontSize(8)
    doc.text(`FECHA: ${formatDateTime(order.created_at)}`, pageWidth / 2, y, { align: 'center' })
    y += 6

    // Separator
    doc.text(''.padStart(40, '-'), pageWidth / 2, y, { align: 'center' })
    y += 6

    // Customer info
    if (order.customer?.name) {
      doc.text(`Cliente: ${order.customer.name.substring(0, 30)}`, margin, y)
      y += 4
    }
    if (order.customer?.document_number) {
      doc.text(`Doc: ${order.customer.document_number}`, margin, y)
      y += 4
    }
    y += 2

    // Separator
    doc.text(''.padStart(40, '-'), pageWidth / 2, y, { align: 'center' })
    y += 6

    // Products header
    doc.setFont('courier', 'bold')
    doc.text('PRODUCTO', margin, y)
    doc.text('TOTAL', pageWidth - margin, y, { align: 'right' })
    y += 4
    doc.setFont('courier', 'normal')

    // Products
    for (const item of order.items) {
      // Product name (truncated)
      const name = item.product_name.substring(0, 25)
      doc.text(name, margin, y)
      y += 4

      // Quantity x Price = Total
      const line = `${item.quantity} x ${formatCurrency(item.price)}`
      doc.text(line, margin + 2, y)
      doc.text(formatCurrency(item.subtotal), pageWidth - margin, y, { align: 'right' })
      y += 5
    }

    // Separator
    y += 2
    doc.text(''.padStart(40, '-'), pageWidth / 2, y, { align: 'center' })
    y += 6

    // Totals
    if (hasShipping(order)) {
      doc.text(shippingLabel(order), margin, y)
      doc.text(shippingAmount(order), pageWidth - margin, y, { align: 'right' })
      y += 4
    }

    if (order.discount && order.discount > 0) {
      doc.text('Descuento:', margin, y)
      doc.text(`-${formatCurrency(order.discount)}`, pageWidth - margin, y, { align: 'right' })
      y += 4
    }

    // Total
    doc.setFont('courier', 'bold')
    doc.setFontSize(10)
    y += 2
    doc.text('TOTAL:', margin, y)
    doc.text(formatCurrency(order.total), pageWidth - margin, y, { align: 'right' })
    y += 8

    // Footer
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    doc.text('*** GRACIAS POR SU COMPRA ***', pageWidth / 2, y, { align: 'center' })

    // Save
    doc.save(`ticket-${order.order_number}.pdf`)
  }

  /**
   * Generate Picking List PDF (no prices, only quantities)
   */
  function downloadPickingList(order: PrintableOrder, storeName: string = 'Mi Tienda') {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const { recipient } = order

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('PICKING LIST', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(storeName, pageWidth / 2, 28, { align: 'center' })

    // Order info
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Pedido: ${order.orderNumber}`, 14, 45)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Fecha: ${formatDateTime(order.createdAt)}`, 14, 52)

    // Shipping info box
    doc.setDrawColor(0, 178, 166)
    doc.setLineWidth(0.5)
    doc.rect(14, 58, pageWidth - 28, 35)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('ENTREGAR A:', 18, 66)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    let yPos = 73
    if (recipient.name) {
      doc.text(recipient.name, 18, yPos)
      yPos += 6
    }
    if (recipient.phone) {
      doc.text(`Tel: ${recipient.phone}`, 18, yPos)
      yPos += 6
    }
    if (recipient.address) {
      doc.text(doc.splitTextToSize(recipient.address, pageWidth - 40)[0], 18, yPos)
      yPos += 6
    }
    const location = locationLine(recipient)
    if (location) {
      doc.text(location, 18, yPos)
    }

    let tableStartY = 100

    // Nota del comprador: suele traer la agencia de destino o quién más puede
    // recibir. Es justo lo que el almacén necesita antes de armar la caja.
    if (order.customerNote) {
      doc.setFillColor(255, 249, 219)
      doc.setDrawColor(234, 179, 8)
      const noteLines = doc.splitTextToSize(order.customerNote, pageWidth - 40)
      const noteHeight = noteLines.length * 5 + 12
      doc.rect(14, 98, pageWidth - 28, noteHeight, 'FD')

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('NOTA DEL CLIENTE:', 18, 105)
      doc.setFont('helvetica', 'normal')
      doc.text(noteLines, 18, 111)

      tableStartY = 98 + noteHeight + 6
    }

    // Products table (without prices)
    const tableData = order.items.map((item, index) => [
      (index + 1).toString(),
      item.sku || '-',
      item.variant ? `${item.name}\n${item.variant}` : item.name,
      item.quantity.toString(),
      '☐' // Checkbox for picker
    ])

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'SKU', 'Producto', 'Cantidad', 'OK']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 178, 166],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 15, halign: 'center', fontSize: 14 }
      },
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 10,
        cellPadding: 4
      }
    })

    // Total items count
    const finalY = (doc as any).lastAutoTable.finalY + 10
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total de artículos: ${totalItems}`, 14, finalY)

    // Signature area
    const signY = finalY + 25
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Preparado por:', 14, signY)
    doc.line(50, signY, 100, signY)

    doc.text('Fecha/Hora:', 110, signY)
    doc.line(135, signY, 190, signY)

    // Footer
    doc.setFontSize(8)
    doc.text('Picking List - Sin precios', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

    // Save
    doc.save(`picking-${order.orderNumber}.pdf`)
  }

  /**
   * Generate CSV file for an order
   */
  function downloadCSV(order: Order) {
    const headers = ['SKU', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']

    const rows = order.items.map(item => [
      item.product_sku || '',
      `"${item.product_name.replace(/"/g, '""')}"`,
      item.quantity,
      item.price.toFixed(2),
      item.subtotal.toFixed(2)
    ])

    // Add summary rows
    rows.push([])
    rows.push(['', '', '', 'Subtotal:', order.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)])

    if (hasShipping(order)) {
      rows.push(['', '', '', shippingLabel(order), (order.shipping_cost ?? 0).toFixed(2)])
    }

    if (order.discount && order.discount > 0) {
      rows.push(['', '', '', 'Descuento:', `-${order.discount.toFixed(2)}`])
    }

    rows.push(['', '', '', 'TOTAL:', order.total.toFixed(2)])

    // Add order info at the end
    rows.push([])
    rows.push(['Pedido:', order.order_number])
    rows.push(['Fecha:', order.created_at])
    rows.push(['Cliente:', order.customer?.name || ''])
    rows.push(['Email:', order.customer?.email || ''])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `pedido-${order.order_number}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  /**
   * Generate Shipping Label PDF (4x6 inches / 100x150mm standard)
   * @param order - The order to generate the label for
   * @param senderInfo - Complete sender information (business name, RUC, address, etc.)
   */
  function downloadShippingLabel(
    order: PrintableOrder,
    senderInfo?: SenderInfo,
    instructions?: string
  ) {
    // 4x6 inches = 101.6 x 152.4 mm (industry standard shipping label)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [101.6, 152.4]
    })

    const pageWidth = 101.6
    const pageHeight = 152.4
    const margin = 5
    const { recipient } = order
    let y = margin

    // Border around entire label
    doc.setDrawColor(0)
    doc.setLineWidth(0.5)
    doc.rect(2, 2, pageWidth - 4, pageHeight - 4)

    // === SENDER SECTION (FROM) ===
    // Calculate sender section height based on content
    const senderSectionHeight = senderInfo?.ruc ? 30 : 25
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y, pageWidth - margin * 2, senderSectionHeight, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('REMITENTE / FROM:', margin + 2, y + 4)

    // Business name (razón social) or commercial name
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const displayName = senderInfo?.businessName || senderInfo?.commercialName || 'Mi Tienda'
    doc.text(displayName, margin + 2, y + 10)

    let senderY = y + 14

    // RUC
    if (senderInfo?.ruc) {
      doc.setFontSize(8)
      doc.text(`RUC: ${senderInfo.ruc}`, margin + 2, senderY)
      senderY += 4
    }

    // Address
    if (senderInfo?.address) {
      doc.setFontSize(7)
      const senderLines = doc.splitTextToSize(senderInfo.address, pageWidth - margin * 2 - 4)
      doc.text(senderLines, margin + 2, senderY)
      senderY += senderLines.length * 3

      // Location (district, province, department)
      const senderLocation = [
        senderInfo.district,
        senderInfo.province,
        senderInfo.department
      ].filter(Boolean).join(', ')
      if (senderLocation) {
        doc.text(senderLocation, margin + 2, senderY)
      }
    }

    // Phone on the right side
    if (senderInfo?.phone) {
      doc.setFontSize(7)
      doc.text(`Tel: ${senderInfo.phone}`, pageWidth - margin - 2, y + 10, { align: 'right' })
    }

    y += senderSectionHeight + 3

    // Separator line
    doc.setLineWidth(1)
    doc.line(margin, y, pageWidth - margin, y)
    y += 3

    // === RECIPIENT SECTION (TO) ===
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('DESTINATARIO / TO:', margin + 2, y + 4)
    y += 8

    // Recipient name (large)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const recipientName = recipient.name || 'Sin nombre'
    const nameLines = doc.splitTextToSize(recipientName.toUpperCase(), pageWidth - margin * 2 - 4)
    doc.text(nameLines, margin + 2, y)
    y += nameLines.length * 6 + 2

    // Documento de quien recibe: todas las agencias de transporte lo exigen en
    // el rótulo. Sin esto el almacén lo copiaba a mano desde los datos de
    // facturación en cada envío.
    if (recipient.docNumber) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${recipient.docType || 'DOC'}: ${recipient.docNumber}`, margin + 2, y)
      y += 5
    }

    // Phone
    if (recipient.phone) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`TEL: ${recipient.phone}`, margin + 2, y)
      y += 5
    }

    // Address
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const address = recipient.address || ''
    if (address) {
      const addressLines = doc.splitTextToSize(address, pageWidth - margin * 2 - 4)
      doc.text(addressLines, margin + 2, y)
      y += addressLines.length * 5 + 2
    }

    // Address line 2
    if (recipient.addressLine2) {
      const addr2Lines = doc.splitTextToSize(recipient.addressLine2, pageWidth - margin * 2 - 4)
      doc.text(addr2Lines, margin + 2, y)
      y += addr2Lines.length * 5 + 2
    }

    // District, Province, Department
    const locationText = locationLine(recipient)
    if (locationText) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const locationLines = doc.splitTextToSize(locationText.toUpperCase(), pageWidth - margin * 2 - 4)
      doc.text(locationLines, margin + 2, y)
      y += locationLines.length * 5 + 2
    }

    // UBIGEO code
    if (recipient.ubigeoCode) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`UBIGEO: ${recipient.ubigeoCode}`, margin + 2, y)
      y += 4
    }

    // Coordinates (latitude/longitude) - useful for delivery drivers
    if (recipient.latitude && recipient.longitude) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(`GPS: ${recipient.latitude}, ${recipient.longitude}`, margin + 2, y)
      y += 4
    }

    // Reference
    if (recipient.reference) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      const refLines = doc.splitTextToSize(`Ref: ${recipient.reference}`, pageWidth - margin * 2 - 4)
      doc.text(refLines, margin + 2, y)
      y += refLines.length * 4 + 2
    }

    // === ORDER INFO SECTION ===
    // Position this at a fixed location from bottom
    const bottomSection = pageHeight - 45

    // Indicaciones escritas al momento de imprimir: agencia de destino, guía de
    // remisión, quién más puede recoger. Se recorta a lo que quepa antes del
    // bloque del pedido en lugar de invadirlo.
    if (instructions?.trim()) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('INDICACIONES:', margin + 2, y + 3)
      y += 6

      doc.setFont('helvetica', 'normal')
      const allLines: string[] = doc.splitTextToSize(instructions.trim(), pageWidth - margin * 2 - 4)
      const maxLines = Math.max(0, Math.floor((bottomSection - y - 2) / 3.5))
      const lines = allLines.slice(0, maxLines)
      if (allLines.length > maxLines && lines.length > 0) {
        lines[lines.length - 1] = `${lines[lines.length - 1]}…`
      }
      doc.text(lines, margin + 2, y)
      y += lines.length * 3.5
    }

    // Separator line
    doc.setLineWidth(0.5)
    doc.line(margin, bottomSection, pageWidth - margin, bottomSection)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('PEDIDO / ORDER:', margin + 2, bottomSection + 5)

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(order.orderNumber, pageWidth / 2, bottomSection + 14, { align: 'center' })

    // Code 128 escaneable del número de pedido
    const barcodeY = bottomSection + 18
    const barcodeHeight = 12
    const barcodeWidth = pageWidth - margin * 4
    const barcode = barcodeDataUrl(order.orderNumber)
    if (barcode) {
      doc.addImage(barcode, 'PNG', margin * 2, barcodeY, barcodeWidth, barcodeHeight)
    }

    // Order number text below barcode
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(order.orderNumber, pageWidth / 2, barcodeY + barcodeHeight + 4, { align: 'center' })

    // Date
    doc.setFontSize(7)
    doc.text(`Fecha: ${formatDateTime(order.createdAt)}`, margin + 2, pageHeight - 8)

    // Items count
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
    doc.text(`${totalItems} artículo(s)`, pageWidth - margin - 2, pageHeight - 8, { align: 'right' })

    // Save
    doc.save(`etiqueta-envio-${order.orderNumber}.pdf`)
  }

  /**
   * Get status text for display
   */
  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      cancelled: 'Cancelado',
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado'
    }
    return statusMap[status] || status
  }

  return {
    downloadPDF,
    downloadTicket,
    downloadPickingList,
    downloadCSV,
    downloadShippingLabel
  }
}
