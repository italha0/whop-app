"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, Plus, Megaphone, Zap, Users, Disc, Linkedin , Instagram } from "lucide-react"

export function HomeSidebar() {
  return (
    <aside className="hidden md:flex w-[280px] shrink-0 flex-col gap-4 border-r border-border bg-card p-4">

      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" size="lg">
        <Plus className="w-4 h-4 mr-2" /> Create new
      </Button>

      <Link href="#" className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3 text-sm hover:border-muted-foreground">
        <span className="flex items-center gap-2"><Megaphone className="w-4 h-4" /> Content Publisher</span>
        <ChevronRight className="w-4 h-4" />
      </Link>

   

      <Link href="#" className=" flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm hover:border-muted-foreground">
        <Linkedin className="w-4 h-4" /> My  Linkedin
      </Link>

      <Link href="https://www.instagram.com/italha.0/" target="_blank" className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 text-sm hover:border-muted-foreground">
        <Instagram className="w-4 h-4" /> My  Instagram
      </Link>

      <div className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
        <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> 0</span>
        <Link href="#" className="underline">Upgrade now</Link>
      </div>

      <div className="mt-2 rounded-xl border border-border bg-gradient-to-br from-purple-100 to-pink-100 p-4">
        <div className="text-base font-semibold">Get more credits</div>
        <p className="mt-1 text-xs text-muted-foreground">Get access to all features and create more viral clips</p>
        <Button className="mt-3 w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:from-yellow-500 hover:to-orange-500">Upgrade Now</Button>
      </div>
    </aside>
  )
}
