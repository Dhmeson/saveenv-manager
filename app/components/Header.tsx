"use client"

import { LogOut } from 'lucide-react'
import { signOut} from 'next-auth/react'
import { useRouter } from 'next/navigation'
export default function Header() {
  const router = useRouter()
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
    } finally {
      router.replace('/')
    }
  }
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5 p-4 flex items-center justify-end text-white">
    <div className="flex items-center space-x-4">
      <button 
        onClick={handleSignOut} 
        className="inline-flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-900/20 transition-all duration-200 hover:bg-red-400 hover:shadow-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent"
        aria-label="Sign out of your account"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  </header>
  )
}


