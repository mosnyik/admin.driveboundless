export interface VehicleOption {
  id: string
  make: string
  model: string
  year: number
  color: string
  pricePerDay: number
  pricePerWeek: number
  deliveryFee: number
  available: boolean
}

export const FUEL_TYPES = ["Regular", "Premium", "Diesel", "Hybrid", "Electric"] as const
export type FuelType = (typeof FUEL_TYPES)[number]

export interface AdminVehicle {
  id: string
  make: string
  model: string
  year: number
  miles: number
  color: string
  pricePerDay: number
  pricePerWeek: number
  minRentalDays: number
  deliveryFee: number
  pickupTimes: string
  fuelType: FuelType
  seats: number
  imageUrl: string | null
  imageAlt: string
  available: boolean
  sortOrder: number
  companyId: string | null
  companyName: string | null
}

export interface VehicleFormValues {
  make: string
  model: string
  year: number
  miles: number
  color: string
  pricePerDay: number | null
  pricePerWeek: number
  minRentalDays: number
  deliveryFee: number
  pickupTimes: string
  fuelType: FuelType
  seats: number
  available: boolean
  companyId: string | null
}
