export function useFormatters() {
  // Formatear moneda (Soles peruanos)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Formatear número con separadores de miles
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-PE').format(num)
  }

  // Formatear porcentaje
  const formatPercentage = (value: number, decimals: number = 1): string => {
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
  const formatDate = (date: string | Date): string => {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  // Formatear fecha y hora (DD/MM/YYYY HH:mm)
  const formatDateTime = (date: string | Date): string => {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date))
  }

  // Formatear hora (HH:mm)
  const formatTime = (date: string | Date): string => {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date))
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
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatRelativeDate,
    formatDate,
    formatDateTime,
    formatTime,
    getChangeColorClass,
    getChangeIcon
  }
}
