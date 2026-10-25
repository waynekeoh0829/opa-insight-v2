import { createContext, useContext, useState, useEffect } from 'react'
const Ctx = createContext()
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('opa_theme') || 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('opa_theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}
export const useTheme = () => useContext(Ctx)
