import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { LayoutDashboard, Upload, FileText, Tag, Package, Settings, LogOut, Sun, Moon, TrendingUp } from 'lucide-react'
import api from '../utils/api'

const links = [
  { to:'/dashboard',  label:'Dashboard',  icon:LayoutDashboard },
  { to:'/upload',     label:'Upload Data', icon:Upload },
  { to:'/report',     label:'Reports',     icon:FileText },
  { to:'/inventory',  label:'Inventory',   icon:Package },
  { to:'/categories', label:'Categories',  icon:Tag },
  { to:'/settings',   label:'Settings',    icon:Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()
  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout(); nav('/login')
  }
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || 'U'
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <TrendingUp size={18} className="text-white"/>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">OPA Insight</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">v2.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}>
            <Icon size={17}/>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <button onClick={toggle} className="sidebar-link sidebar-link-inactive w-full">
          {theme==='dark' ? <Sun size={17}/> : <Moon size={17}/>}
          <span>{theme==='dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={handleLogout} className="sidebar-link sidebar-link-inactive w-full text-red-500 hover:text-red-600 dark:text-red-400">
          <LogOut size={17}/>
          <span>Logout</span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
               style={{ background: user?.avatar_color || '#6366f1' }}>
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
