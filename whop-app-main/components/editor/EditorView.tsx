"use client"

import { motion } from "framer-motion"
import { ControlPanel } from "./ControlPanel"
import { PreviewPanel } from "./PreviewPanel"
import { DownloadModal } from "./DownloadModal"
import { useAppStore } from "@/lib/store"
import { useState } from "react"

export function EditorView() {
  const { renderProgress, setRenderProgress, resetRender } = useAppStore()
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit')

  // Handler for download button in modal
  const handleDownload = () => {
    if (renderProgress.downloadUrl) {
      window.open(renderProgress.downloadUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => resetRender(), 500)
    }
  }

  // Handler for closing modal (after error or done)
  const handleClose = () => {
    resetRender()
  }

  // Allow closing modal if status is 'done' or 'error'
  const canClose = renderProgress.status === 'done' || renderProgress.status === 'error'

  return (
    <div className="h-full flex flex-col md:flex-row bg-gradient-to-br from-background to-background/95">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="grid grid-cols-2 p-1 m-2 bg-muted/50 rounded-xl">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`py-3 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden ${
              mobileTab === 'edit'
                ? 'text-foreground bg-background shadow-lg shadow-primary/20 border border-primary/20 ring-2 ring-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            onClick={() => setMobileTab('edit')}
          >
            {mobileTab === 'edit' && (
              <span className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none animate-pulse" />
            )}
            <span className="relative">Edit</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`py-3 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden ${
              mobileTab === 'preview'
                ? 'text-foreground bg-background shadow-lg shadow-primary/20 border border-primary/20 ring-2 ring-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
            onClick={() => setMobileTab('preview')}
          >
            {mobileTab === 'preview' && (
              <span className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none animate-pulse" />
            )}
            <span className="relative">Preview</span>
          </motion.button>
        </div>
      </div>
      {/* Control Panel - Left Side */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1] }}
        className={`w-full md:w-[40rem] md:border-r border-border/50 bg-card/50 backdrop-blur-sm overflow-y-auto md:block ${mobileTab === 'edit' ? 'block' : 'hidden'} md:shadow-xl md:shadow-black/5`}
      >
        <ControlPanel />
      </motion.div>

      {/* Preview Panel - Right Side */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.320, 1] }}
        className={`flex-1 flex items-center justify-center bg-gradient-to-br from-background/50 to-background md:block ${mobileTab === 'preview' ? 'block' : 'hidden'}`}
      >
        <PreviewPanel />
      </motion.div>

      {/* Download Modal */}
      {renderProgress.isRendering && (
        <DownloadModal
          isRendering={renderProgress.isRendering}
          status={['pending','rendering','done','error'].includes(renderProgress.status) ? renderProgress.status as any : 'pending'}
          progress={renderProgress.progress}
          error={renderProgress.error || null}
          onDownload={handleDownload}
          canClose={canClose}
          handleClose={handleClose}
        />
      )}
    </div>
  )
}