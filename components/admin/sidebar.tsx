"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [{ href: "/", label: "Dashboard", icon: LayoutDashboard }]

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  const initials = email.slice(0, 2).toUpperCase()

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
          <Image src="/images/logo.png" alt="" width={36} height={33} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-sm font-semibold leading-tight text-sidebar-foreground">
            Drive Boundless
          </p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/60">
              <Avatar className="size-8">
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm text-sidebar-foreground">{email}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setTheme(theme === "dark" ? "light" : "dark")
              }}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={loggingOut}
              onSelect={(event) => {
                event.preventDefault()
                handleLogout()
              }}
            >
              <LogOut className="size-4" />
              {loggingOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
