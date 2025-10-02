"use client"

import { motion } from "framer-motion"
import dynamic from "next/dynamic"
const Player = dynamic(() => import("@remotion/player").then(mod => mod.Player), { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">Loading preview...</div> })
import { useAppStore } from "@/lib/store"
import { MessageConversation } from "@/remotion/MessageConversation"
import { Smartphone, Play, Pause } from "lucide-react"
import { useState, useMemo, useRef, useCallback } from "react"

export function PreviewPanel() {
  const { 
    messages, 
    characters, 
    contactName, 
    selectedTheme 
  } = useAppStore()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef<any>(null)

  const inputProps = useMemo(() => ({
    messages: messages.map((m, index) => ({
      id: index + 1,
      text: m.text || "(empty message)",
      sent: m.characterId === "you",
      time: new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    })),
    characters: [
      { id: "them", name: contactName, color: "bg-blue-500" },
      { id: "you", name: "You", color: "bg-green-500" },
    ],
    theme: selectedTheme,
    contactName,
    isPro: false,
    alwaysShowKeyboard: true
  }), [messages, characters, contactName, selectedTheme])

  const durationInFrames = Math.max(300, messages.length * 120) // At least 10 seconds, +4 seconds per message

  const handlePlayPause = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
        setIsPlaying(false)
      } else {
        playerRef.current.play()
        setIsPlaying(true)
      }
    }
  }, [isPlaying])

  const handlePlayerPlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 bg-gradient-to-br from-background/50 to-muted/20">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.320, 1] }}
        className="space-y-8"
      >
        {/* Header hidden to match screenshot */}

        {/* Phone Frame with Preview */}
        <motion.div 
          whileHover={{ scale: 1.03, y: -8 }} 
          transition={{ duration: 0.4, ease: [0.23, 1, 0.320, 1] }} 
          className="relative p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-2xl shadow-black/20 border border-border/30"
        >
          {/* Composition viewport only (MessageConversation includes its own phone) */}
          <div className="relative w-[320px] h-[600px] rounded-2xl overflow-hidden bg-background/50 shadow-inner">
            {messages.length > 0 ? (
              <Player
                ref={playerRef}
                component={MessageConversation as any}
                durationInFrames={durationInFrames}
                fps={30}
                compositionWidth={390}
                compositionHeight={844}
                inputProps={inputProps}
                controls={true}
                autoPlay={false}
                loop
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'transparent', backgroundColor: 'transparent' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
                    <Smartphone className="w-10 h-10 text-primary/60" />
                  </div>
                  <p className="text-sm text-center px-8 font-medium">Add messages to see your video preview</p>
                  <p className="text-xs text-center px-8 mt-2 text-muted-foreground/60">Your conversation will come to life here</p>
                </motion.div>
              </div>
            )}
          </div>
          {/* Play/Pause Button Overlay */}
          {messages.length > 0 && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center group pointer-events-none"
              transition={{ duration: 0.3, ease: [0.23, 1, 0.320, 1] }}
            >
              <div className="w-20 h-20 bg-black/30 backdrop-blur-lg rounded-full flex items-center justify-center shadow-2xl shadow-black/40 border border-white/20 group-hover:bg-black/40 transition-all duration-300 pointer-events-auto">
                {isPlaying ? (
                  <Pause className="w-10 h-10 text-white drop-shadow-lg" />
                ) : (
                  <Play className="w-10 h-10 text-white ml-1 drop-shadow-lg" />
                )}
              </div>
            </motion.button>
          )}
        </motion.div>

        {/* Low-res preview label */}
        <div className="w-full flex items-center justify-center">
          <div className="px-4 py-2 rounded-full bg-black text-white/90 text-sm shadow-sm">Low-res preview</div>
        </div>
      </motion.div>
    </div>
  )
}