import { computed } from 'vue'
import { useStoreConfigStore } from '@/stores/store-config.store'

// Mapeo ISO2 → locale BCP47 para Intl. PE/CR/EC usan es-* respectivamente;
// fallback a 'es' para no romper si la tienda aún no cargó country config.
const LOCALE_BY_ISO2: Record<string, string> = {
  PE: 'es-PE',
  CR: 'es-CR',
  EC: 'es-EC',
  CO: 'es-CO',
  CL: 'es-CL',
  MX: 'es-MX',
}

export function useFormatters() {
  // Lazy resolve para no crashear si se llama antes de que Pinia esté inicializado
  // (algunos consumers usan formatters en migración de SSR-like flows).
  const getCountry = () => {
    try {
      return useStoreConfigStore().countryConfig
    } catch {
      return null
    }
  }

  // Moneda con la que la tienda vende (`tiendasgenerales.moneda_id`). Es
  // independiente del país: una tienda peruana puede cobrar en USD. Manda sobre
  // la moneda default del país; el país solo aporta locale y decimales.
  const getStoreCurrency = () => {
    try {
      const config = useStoreConfigStore().savedConfig
      return config?.moneda_iso
        ? { iso: config.moneda_iso, simbolo: config.moneda_simbolo }
        : null
    } catch {
      return null
    }
  }

  const getLocale = (): string => {
    const iso2 = getCountry()?.iso2
    return iso2 ? (LOCALE_BY_ISO2[iso2] ?? 'es') : 'es-PE'
  }

  // ISO 4217 de la moneda en la que se muestran los montos.
  const currencyIso = computed(() => {
    return getStoreCurrency()?.iso || getCountry()?.moneda_iso || 'PEN'
  })

  // Símbolo para los sitios que arman el monto a mano (charts, prefijos de
  // InputNumber, labels). Preferir formatCurrency() cuando se pueda.
  const currencySymbol = computed(() => {
    return getStoreCurrency()?.simbolo || getCountry()?.moneda_simbolo || 'S/'
  })

  // Formatear moneda según la moneda de venta de la tienda. Cae a la moneda del
  // país, y a PEN/S/ si nada se cargó todavía (caso boot inicial).
  const formatCurrency = (amount: number): string => {
    const country = getCountry()
    const currency = currencyIso.value
    // Los decimales del país solo aplican si la tienda vende en la moneda de su
    // país; para una moneda ajena (p.ej. CLP sin decimales en una tienda PE)
    // dejamos que Intl use los de la propia moneda.
    const useCountryDecimals = !country?.moneda_iso || country.moneda_iso === currency
    const decimals = useCountryDecimals ? (country?.decimales ?? 2) : null

    return new Intl.NumberFormat(getLocale(), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      ...(decimals !== null
        ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals + 1 }
        : {})
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(getLocale()).format(num)
  }

  // Formatear porcentaje
  const formatPercentage = (value: number, decimals: number = 2): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
  }

  // Formatear fecha relativa (hace 2 horas, hace 1 día, etc.)
  const formatRelativeDate = (date: string | Date): string => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Justo ahora'
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
    if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`

    return formatDate(date)
  }

  // Formatear fecha (DD/MM/YYYY)
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A'

    // If date is a string in YYYY-MM-DD format (without time), treat it as a local date
    // to avoid timezone conversion issues
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number)
      const parsedDate = new Date(year, month - 1, day)

      return new Intl.DateTimeFormat(getLocale(), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(parsedDate)
    }

    // For other date formats, use normal Date parsing
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return 'N/A'

    return new Intl.DateTimeFormat(getLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(parsedDate)
  }

  // Formatear fecha y hora (DD/MM/YYYY HH:mm)
  const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A'
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return 'N/A'

    return new Intl.DateTimeFormat(getLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(parsedDate)
  }

  // Formatear fecha y hora con segundos (DD/MM/YYYY HH:mm:ss)
  //
  // Para líneas de tiempo, donde dos eventos pueden caer dentro del mismo
  // minuto: un pedido que se paga a los 29 segundos de creado se ve idéntico
  // a su creación si solo se muestran horas y minutos.
  const formatDateTimeWithSeconds = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A'
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return 'N/A'

    return new Intl.DateTimeFormat(getLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(parsedDate)
  }

  // Formatear hora (HH:mm)
  const formatTime = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A'
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return 'N/A'

    return new Intl.DateTimeFormat(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(parsedDate)
  }

  // Obtener clase de color según el cambio (positivo/negativo)
  const getChangeColorClass = (isPositive: boolean): string => {
    return isPositive ? 'text-green-600' : 'text-red-600'
  }

  // Obtener ícono según el cambio (positivo/negativo)
  const getChangeIcon = (isPositive: boolean): string => {
    return isPositive ? 'pi-arrow-up' : 'pi-arrow-down'
  }

  return {
    currencyIso,
    currencySymbol,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatRelativeDate,
    formatDate,
    formatDateTime,
    formatDateTimeWithSeconds,
    formatTime,
    getChangeColorClass,
    getChangeIcon
  }
}
