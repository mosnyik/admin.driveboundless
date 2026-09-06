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

/** The subset of a company's fields an owner may edit about their own company. */
export interface OwnCompanyFormValues {
  address: string
  phone: string
  email: string
  notificationEmail: string
}
