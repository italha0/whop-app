import { create } from 'zustand'

interface Character {
  id: string
  name: string
  color: string
  avatar?: string
}

interface Message {
  id: string
  characterId: string
  text: string
  timestamp: number
}

interface RenderProgress {
  isRendering: boolean
  progress: number
  status: 'idle' | 'pending' | 'rendering' | 'done' | 'error'
  jobId?: string
  downloadUrl?: string
  error?: string
}

interface AppState {
  // UI State
  isSidebarCollapsed: boolean
  activeTab: 'editor' | 'projects' | 'renders' | 'settings'
  theme: 'dark' | 'light'
  
  // Composition State
  characters: Character[]
  messages: Message[]
  contactName: string
  selectedTheme: 'imessage' | 'whatsapp' | 'snapchat'
  
  // Render State
  renderProgress: RenderProgress
  
  // User State
  user: any
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveTab: (tab: 'editor' | 'projects' | 'renders' | 'settings') => void
  setTheme: (theme: 'dark' | 'light') => void
  
  // Composition Actions
  setContactName: (name: string) => void
  setSelectedTheme: (theme: 'imessage' | 'whatsapp' | 'snapchat') => void
  addMessage: () => void
  updateMessage: (id: string, text: string) => void
  toggleMessageSpeaker: (id: string, speaker: 'them' | 'you') => void
  deleteMessage: (id: string) => void
  setCharacters: (characters: Character[]) => void
  setMessages: (messages: Message[]) => void
  
  // Render Actions
  setRenderProgress: (progress: Partial<RenderProgress>) => void
  resetRender: () => void
  
  // User Actions
  setUser: (user: any) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial UI State
  isSidebarCollapsed: false,
  activeTab: 'editor',
  theme: 'light',
  
  // Initial Composition State
  characters: [
    { id: "them", name: "Contact", color: "bg-blue-500" },
    { id: "you", name: "You", color: "bg-green-500" },
  ],
  messages: [],
  contactName: "Contact",
  selectedTheme: 'imessage',
  
  // Initial Render State
  renderProgress: {
    isRendering: false,
    progress: 0,
    status: 'idle'
  },
  
  // Initial User State
  user: null,
  
  // UI Actions
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => set({ theme }),
  
  // Composition Actions
  setContactName: (name) => {
    set({ contactName: name })
    // Also update the "them" character name
    const { characters } = get()
    const updatedCharacters = characters.map(c => 
      c.id === "them" ? { ...c, name } : c
    )
    set({ characters: updatedCharacters })
  },
  
  setSelectedTheme: (theme) => set({ selectedTheme: theme }),
  
  addMessage: () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      characterId: "them",
      text: "",
      timestamp: Date.now()
    }
    set(state => ({ messages: [...state.messages, newMessage] }))
  },
  
  updateMessage: (id, text) => {
    set(state => ({
      messages: state.messages.map(m => m.id === id ? { ...m, text } : m)
    }))
  },
  
  toggleMessageSpeaker: (id, speaker) => {
    set(state => ({
      messages: state.messages.map(m => 
        m.id === id ? { ...m, characterId: speaker } : m
      )
    }))
  },
  
  deleteMessage: (id) => {
    set(state => ({
      messages: state.messages.filter(m => m.id !== id)
    }))
  },
  
  setCharacters: (characters) => set({ characters }),
  setMessages: (messages) => set({ messages }),
  
  // Render Actions
  setRenderProgress: (progress) => {
    set(state => ({
      renderProgress: { ...state.renderProgress, ...progress }
    }))
  },
  
  resetRender: () => {
    set({
      renderProgress: {
        isRendering: false,
        progress: 0,
        status: 'idle'
      }
    })
  },
  
  // User Actions
  setUser: (user) => set({ user })
}))