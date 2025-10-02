"use client"

import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"

type Props = {
  title: string
  description: string
  href: string
  gradient: string // tailwind gradient classes
  icon: ReactNode
  imageSrc?: string
}

export function HomeCard({ title, description, href, gradient, icon, imageSrc }: Props) {
  return (
    <Link href={href} className="group block">
      <div className={`relative overflow-hidden rounded-2xl border border-border ${gradient} p-5 md:p-6 shadow-sm`}>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-white/80 p-2 text-foreground shadow-sm">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold text-foreground">{title}</h3>
            <p className="text-xs md:text-sm text-foreground/80 mt-1 max-w-xl">{description}</p>
          </div>
          {imageSrc && (
            <div className="hidden sm:block relative">
              <div className="relative  rounded-2xl shadow-lg shadow-black/10 overflow-hidden w-28 h-20 md:w-20 md:h-24 translate-x-2 group-hover:translate-x-3 transition-transform">
                <Image src={imageSrc} alt={title} fill className="object-contain" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
