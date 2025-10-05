"use client"

import { motion } from "framer-motion"
import { Settings } from "lucide-react"

export function SettingsView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full p-8 overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>
        <div className="bg-card rounded-xl p-12 text-center border border-border">
          <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Settings</h2>
          <p className="text-muted-foreground">
            App preferences and configuration options will be available here.
          </p>
        </div>
      </div>
    </motion.div>
  )
}