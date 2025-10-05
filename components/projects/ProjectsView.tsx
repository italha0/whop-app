"use client"

import { motion } from "framer-motion"
import { FolderOpen } from "lucide-react"

export function ProjectsView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full p-8 overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Projects</h1>
        <div className="bg-card rounded-xl p-12 text-center border border-border">
          <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No projects yet</h2>
          <p className="text-muted-foreground">
            Your saved projects will appear here. Start creating to build your library!
          </p>
        </div>
      </div>
    </motion.div>
  )
}