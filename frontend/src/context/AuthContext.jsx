import { createContext, useContext, useState, useEffect } from 'react'
const Ctx = createContext()
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('opa_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('opa_token') || null)
  const login = (t, u) => {
    setToken(t); setUser(u)
    localStorage.setItem('opa_token', t)
    localStorage.setItem('opa_user', JSON.stringify(u))
  }
  const logout = () => {
    setToken(null); setUser(null)
    localStorage.removeItem('opa_token')
    localStorage.removeItem('opa_user')
  }
  const updateUser = (u) => { setUser(u); localStorage.setItem('opa_user', JSON.stringify(u)) }
  return <Ctx.Provider value={{ user, token, login, logout, updateUser }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
