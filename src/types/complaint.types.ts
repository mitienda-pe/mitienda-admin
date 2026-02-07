export interface Complaint {
  id: number
  code: string
  correlativo: string
  date: string
  name: string
  legal_representative: string | null
  address: string
  document_type: string | null
  document_number: string
  email: string
  phone: string
  good_type: string | null
  claimed_amount: number
  good_description: string
  complaint_type: string | null
  complaint_type_id: number
  complaint_detail: string
  order_detail: string | null
  response: string | null
  response_date: string | null
  seen: boolean
  status: 'pending' | 'attended'
}

export interface ComplaintFilters {
  search: string
  status: 'pending' | 'attended' | ''
  type: '' | '1' | '2'
}

export interface ComplaintStats {
  total: number
  pending: number
  attended: number
  unseen: number
}
