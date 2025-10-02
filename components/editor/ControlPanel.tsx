"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Sparkles } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useRef, memo } from "react"
import { createClient } from "@/lib/appwrite/client"

// Theme selection is fixed to iMessage per new design

const ControlPanelComponent = () => {
  const {
    contactName,
    setContactName,
    selectedTheme,
    messages,
    addMessage,
    updateMessage,
    toggleMessageSpeaker,
    deleteMessage,
    setRenderProgress,
    resetRender
  } = useAppStore()
  
  const { toast } = useToast()
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
    }
  }, [])

  // ...existing code...
  const handleRender = async () => {
    if (messages.length === 0) {
      toast({
        title: "No messages",
        description: "Add some messages first!",
        variant: "destructive"
      })
      return
    }

    setRenderProgress({
      isRendering: true,
      status: 'pending',
      progress: 0
    })

    try {
      // Get user ID from Whop authentication context
      const userId = 'user_hF3wMP4gNGUTU'; // This should come from Whop authentication context
      
      const response = await fetch('/api/render-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          renderData: {
            characters: [
              { id: "them", name: contactName, color: "bg-blue-500" },
              { id: "you", name: "You", color: "bg-green-500" },
            ],
            messages,
            theme: selectedTheme,
            contactName,
            isPro: false
          }
        }),
      })

      if (response.status === 403) {
        toast({
          title: "Subscription Required",
          description: "You need an active subscription to render videos.",
          variant: "destructive"
        })
        setRenderProgress({
          status: 'error',
          error: 'Active subscription required'
        })
        return
      }

      if (response.status === 202) {
        const { data } = await response.json()
        const { jobId, statusUrl } = data
        setRenderProgress({ jobId, status: 'rendering' })
        
        // Start polling for status
        pollRenderStatus(jobId)
      } else if (response.ok) {
        // Direct download (rare path) -> open in new tab using blob URL
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        // We intentionally do not revoke immediately to allow the tab to load
        setTimeout(() => URL.revokeObjectURL(url), 30000)
        resetRender()
      }
    } catch (error) {
      console.error('Render error:', error)
      setRenderProgress({
        status: 'error',
        error: 'Failed to start render'
      })
    }
  }

  const pollRenderStatus = async (jobId: string) => {
    let attempt = 0;
    const maxInterval = 10000; // 10 seconds max
    const baseInterval = 2000; // Start at 2 seconds

    const poll = async () => {
      if (!isMountedRef.current) return;
      try {
        const userId = 'user_hF3wMP4gNGUTU'; // This should come from Whop authentication context
        const response = await fetch(`/api/render-job?userId=${userId}&jobId=${jobId}`)
        if (response.ok) {
          const { data } = await response.json()
          const { status, url, error } = data
          if (!isMountedRef.current) return;
          if (status === 'done' && url) {
            setRenderProgress({ status: 'done', downloadUrl: url })
            return;
          }
          if (status === 'error') {
            setRenderProgress({ status: 'error', error })
            return;
          }
          // Exponential backoff: interval increases with each attempt, up to maxInterval
          attempt++;
          const interval = Math.min(baseInterval * Math.pow(1.5, attempt), maxInterval);
          if (isMountedRef.current) {
            pollTimeoutRef.current = setTimeout(poll, interval);
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          setRenderProgress({ status: 'error', error: 'Failed to check render status' })
        }
      }
    }
    poll();
  }

  return (
    <div className="p-6 space-y-8 h-full pb-28 md:pb-6">
      {/* Header */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.23, 1, 0.320, 1] }}
      >
        <div className="space-y-3 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-foreground">
            CREATE A FAKE
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">iMESSAGE VIDEO</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Type in any story you’d like to be told in the video
          </p>
        </div>
      </motion.div>

      {/* Contact Name */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <Label className="text-sm font-semibold text-foreground">Name</Label>
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-card to-card/80 rounded-xl border border-border/60 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-lg shadow-blue-500/25">
            {contactName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "C"}
          </div>
          <Input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-foreground placeholder:text-muted-foreground text-sm"
            placeholder="Enter contact name"
          />
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 flex-1 overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">Conversation</Label>
          <Button
            onClick={addMessage}
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        {messages.map((message, index) => {
          const isThem = message.characterId === "them";
          return (
            <motion.div
              key={message.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="rounded-xl border border-border/60 bg-gradient-to-r from-card to-card/90 relative flex items-stretch gap-0 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300"
            >
              {/* Left accent bar */}
              <div className={`w-1 rounded-l-xl ${isThem ? 'bg-gradient-to-b from-blue-400 to-blue-600' : 'bg-gradient-to-b from-green-400 to-green-600'}`} />
              {/* Text area */}
              <div className="flex-1 p-3">
                <Textarea
                  value={message.text}
                  onChange={(e) => updateMessage(message.id, e.target.value)}
                  placeholder={isThem ? "Type here..." : "Type here..."}
                  className="resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none text-foreground min-h-[72px] text-sm"
                />
              </div>
              {/* Controls */}
              <div className="pr-3 py-3 flex flex-col items-end gap-2 w-[112px]">
                <div className="inline-flex p-1 bg-muted rounded-full">
                  <button
                    onClick={() => toggleMessageSpeaker(message.id, "them")}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${isThem ? "bg-blue-500 text-white" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    Them
                  </button>
                  <button
                    onClick={() => toggleMessageSpeaker(message.id, "you")}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${!isThem ? "bg-green-500 text-white" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    You
                  </button>
                </div>
                <Button
                  onClick={() => deleteMessage(message.id)}
                  size="icon"
                  variant="ghost"
                  className="text-red-600 hover:text-red-600/80 hover:bg-red-100 w-8 h-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Click "Add" to create your first message</p>
          </div>
        )}
      </motion.div>

      {/* Generate Button - bottom for all devices */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="pt-4 border-t border-border"
      >
        <Button
          onClick={handleRender}
          disabled={messages.length === 0}
          className="w-full h-14 bg-gradient-to-r from-primary to-pink-500 text-white font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform duration-200 rounded-xl"
          style={{ maxWidth: 480, margin: '0 auto' }}
        >
          <Sparkles className="w-6 h-6 mr-2" />
          Generate Video
        </Button>
      </motion.div>
    </div>
  );
}
export const ControlPanel = memo(ControlPanelComponent)