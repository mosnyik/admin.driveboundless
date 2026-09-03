"use client"

import { useTheme } from "next-themes"
import { Laptop, Moon, Sun } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const OPTIONS = [
  { value: "system", label: "System", icon: Laptop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={theme ?? "system"}
      onValueChange={(value) => value && setTheme(value)}
      className="w-full"
    >
      {OPTIONS.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className="gap-1.5">
          <option.icon className="size-4" />
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
