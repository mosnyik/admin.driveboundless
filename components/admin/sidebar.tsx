"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { FileText, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

function BrandMark() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
        <Image src="/images/logo.png" alt="" width={36} height={33} className="h-[33px] w-[36px]" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-serif text-sm font-semibold leading-tight text-sidebar-foreground">
          Drive Boundless
        </p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Admin</p>
      </div>
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  )
}

function AccountMenu({ email }: { email: string }) {
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
  )
}

export function AdminSidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <BrandMark />
        <NavLinks />
        <AccountMenu email={email} />
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
            <Image src="/images/logo.png" alt="" width={32} height={29} className="h-[29px] w-[32px]" />
          </div>
          <p className="font-serif text-sm font-semibold leading-tight text-sidebar-foreground">
            Drive Boundless
          </p>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Links to the admin dashboard sections and account menu.
            </SheetDescription>
            <BrandMark />
            <NavLinks onNavigate={() => setOpen(false)} />
            <AccountMenu email={email} />
          </SheetContent>
        </Sheet>
      </header>
    </>
  )
}
