"use client"

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createVehicle, updateVehicle } from "@/lib/actions/vehicles"
import { FUEL_TYPES, type VehicleFormValues } from "@/lib/vehicle-types"
import type { Company } from "@/lib/company-types"

const UNASSIGNED = "unassigned"

const DEFAULT_VALUES: VehicleFormValues = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  miles: 0,
  color: "",
  pricePerDay: 0,
  pricePerWeek: null,
  minRentalDays: 1,
  deliveryFee: 0,
  pickupTimes: "9 AM - 6 PM",
  fuelType: "Regular",
  seats: 5,
  available: true,
  companyId: null,
}

export function VehicleForm({
  mode,
  vehicleId,
  initialValues,
  initialImageUrl,
  companies,
}: {
  mode: "create" | "edit"
  vehicleId?: string
  initialValues?: VehicleFormValues
  initialImageUrl?: string | null
  companies: Company[]
}) {
  const router = useRouter()
  const [values, setValues] = useState<VehicleFormValues>(initialValues ?? DEFAULT_VALUES)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl ?? null)
  const [pending, startTransition] = useTransition()

  function update<K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createVehicle(values, imageFile)
          toast.success("Vehicle added to the fleet")
          router.push(result.id ? `/fleet/${result.id}` : "/fleet")
        } else if (vehicleId) {
          await updateVehicle(vehicleId, values, imageFile)
          toast.success("Vehicle updated")
          router.push("/fleet")
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't save the vehicle.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Photo</Label>
        <div className="flex items-center gap-4">
          <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {imagePreview ? (
              <Image src={imagePreview} alt="" fill className="object-cover" unoptimized />
            ) : (
              <ImagePlus className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <label>
                <ImagePlus className="size-4" />
                {imagePreview ? "Replace photo" : "Upload photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </Button>
            {imagePreview && (
              <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                <Trash2 className="size-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="make">
            Make <span className="text-destructive">*</span>
          </Label>
          <Input
            id="make"
            value={values.make}
            onChange={(event) => update("make", event.target.value)}
            placeholder="Mercedes-Benz"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">
            Model <span className="text-destructive">*</span>
          </Label>
          <Input
            id="model"
            value={values.model}
            onChange={(event) => update("model", event.target.value)}
            placeholder="S-Class"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">
            Year <span className="text-destructive">*</span>
          </Label>
          <Input
            id="year"
            type="number"
            value={values.year}
            onChange={(event) => update("year", Number(event.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">
            Color <span className="text-destructive">*</span>
          </Label>
          <Input
            id="color"
            value={values.color}
            onChange={(event) => update("color", event.target.value)}
            placeholder="Obsidian Black"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="miles">
            Mileage <span className="text-destructive">*</span>
          </Label>
          <Input
            id="miles"
            type="number"
            value={values.miles}
            onChange={(event) => update("miles", Number(event.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seats">
            Seats <span className="text-destructive">*</span>
          </Label>
          <Input
            id="seats"
            type="number"
            value={values.seats}
            onChange={(event) => update("seats", Number(event.target.value))}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pricePerDay">
            Price per day ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pricePerDay"
            type="number"
            min={0}
            value={values.pricePerDay}
            onChange={(event) => update("pricePerDay", Number(event.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricePerWeek">
            Price per week ($) <span className="text-muted-foreground">— optional</span>
          </Label>
          <Input
            id="pricePerWeek"
            type="number"
            min={0}
            value={values.pricePerWeek ?? ""}
            onChange={(event) =>
              update("pricePerWeek", event.target.value === "" ? null : Number(event.target.value))
            }
            placeholder="Falls back to daily × 7 × 90%"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minRentalDays">
            Minimum rental days <span className="text-destructive">*</span>
          </Label>
          <Input
            id="minRentalDays"
            type="number"
            min={1}
            value={values.minRentalDays}
            onChange={(event) => update("minRentalDays", Number(event.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deliveryFee">
            Delivery fee ($) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="deliveryFee"
            type="number"
            min={0}
            value={values.deliveryFee}
            onChange={(event) => update("deliveryFee", Number(event.target.value))}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pickupTimes">
            Pickup times <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pickupTimes"
            value={values.pickupTimes}
            onChange={(event) => update("pickupTimes", event.target.value)}
            placeholder="9 AM - 6 PM"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelType">Fuel type</Label>
          <Select value={values.fuelType} onValueChange={(value) => update("fuelType", value as VehicleFormValues["fuelType"])}>
            <SelectTrigger id="fuelType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Owner company</Label>
        <Select
          value={values.companyId ?? UNASSIGNED}
          onValueChange={(value) => update("companyId", value === UNASSIGNED ? null : value)}
        >
          <SelectTrigger id="company" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label htmlFor="available">Available</Label>
          <p className="text-sm text-muted-foreground">Shown as bookable on the website.</p>
        </div>
        <Switch id="available" checked={values.available} onCheckedChange={(checked) => update("available", checked)} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : mode === "create" ? (
            "Add vehicle"
          ) : (
            "Save changes"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/fleet")} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
