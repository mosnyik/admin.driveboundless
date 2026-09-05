export interface Company {
  id: string
  name: string
  dbaName: string
  address: string
  phone: string
  email: string
  notificationEmail: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CompanyFormValues {
  name: string
  dbaName: string
  address: string
  phone: string
  email: string
  notificationEmail: string
  active: boolean
}
