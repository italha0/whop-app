"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { 
  Menu, 
  User, 
  Settings, 
  LogOut,
  MessageSquare 
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/appwrite/client"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { 
    isSidebarCollapsed, 
    setSidebarCollapsed, 
    user, 
    setUser 
  } = useAppStore()
  
  const router = useRouter()
  const { account } = createClient()

  const handleSignOut = async () => {
    try {
      await account.deleteSession("current")
      setUser(null)
      router.push("/")
    } catch (e) {
      // Optionally show error toast
      setUser(null)
      router.push("/")
    }
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-16 border-b border-border bg-card backdrop-blur supports-[backdrop-filter]:bg-card/95 px-4 flex items-center justify-between relative z-50"
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <Image src="/logo.png" alt="logo" width={140} height={36} />
        </motion.div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Welcome back,</span>
              <span className="text-foreground font-medium">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
        
        {!user && (
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            onClick={() => router.push("/auth/login")}
          >
            Sign In (optional)
          </Button>
        )}
      </div>
    </motion.nav>
  )
}