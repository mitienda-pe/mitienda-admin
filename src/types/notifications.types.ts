export interface EmailNotification {
  id: number
  email: string
  verified: boolean
}

export interface OneSignalSubscription {
  id: number
  player_id: string
  browser: string
  verified: boolean
}

export interface NotificationsData {
  email: EmailNotification | null
  onesignal: OneSignalSubscription[]
}

export interface SaveEmailRequest {
  email: string
}

export interface OneSignalSubscribeRequest {
  player_id: string
  browser: string
}

export interface OneSignalUnsubscribeRequest {
  player_id: string
}

export interface OneSignalStatusResponse {
  subscribed: boolean
  browser?: string
}
