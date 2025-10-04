"use client"

import { motion } from "framer-motion"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"
import { EditorView } from "../editor/EditorView"
import { ProjectsView } from "../projects/ProjectsView"
import { RendersView } from "../renders/RendersView"
import { SettingsView } from "../settings/SettingsView"
import { useAppStore } from "@/lib/store"
import { useEffect } from "react"

export function MainLayout() {
  const { activeTab } = useAppStore()

  const renderContent = () => {
    switch (activeTab) {
      case 'editor':
        return <EditorView />
      case 'projects':
        return <ProjectsView />
      case 'renders':
        return <RendersView />
      case 'settings':
        return <SettingsView />
      default:
        return <EditorView />
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <motion.main
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-auto md:overflow-hidden pb-24 md:pb-0"
        >
          {renderContent()}
        </motion.main>
      </div>
    </div>
  )
}