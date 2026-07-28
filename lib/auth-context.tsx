'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, User } from './api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refetch: async () => {},
})

const DEVELOPER_QUIZ_URL = 'https://orel-id.istoriyaislama.workers.dev/pages/user/developer-quiz'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const me = await api.getCurrentUser()
      if (me.role === 'user') {
        window.location.href = DEVELOPER_QUIZ_URL
        return
      }
      setUser(me)
    } catch {
      window.location.href = DEVELOPER_QUIZ_URL
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
