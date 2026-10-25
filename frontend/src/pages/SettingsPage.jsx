import { useState, useEffect } from 'react'
import { User, Lock, Bell, Palette, Save, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#f97316','#14b8a6','#84cc16']

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { theme, toggle } = useTheme()
  const [profile, setProfile] = useState({ name: user?.name||'', avatar_color: user?.avatar_color||'#6366f1' })
  const [pwd, setPwd] = useState({ password:'', new_password:'', confirm:'' })
  const [notifs, setNotifs] = useState([])
  const [status, setStatus] = useState({})
  const [nloading, setNloading] = useState(false)

  useEffect(() => {
    setNloading(true)
    api.get('/notifications').then(r=>setNotifs(r.data)).finally(()=>setNloading(false))
  }, [])

  const saveProfile = async () => {
    try {
      await api.put('/auth/profile', { name: profile.name, avatar_color: profile.avatar_color })
      updateUser({ ...user, name: profile.name, avatar_color: profile.avatar_color })
      setStatus({ profile: { ok:true, msg:'Profile updated!' } })
    } catch(e) { setStatus({ profile: { ok:false, msg:e.response?.data?.error||'Error' } }) }
  }

  const savePassword = async () => {
    if(pwd.new_password !== pwd.confirm) { setStatus({ pwd: { ok:false, msg:'Passwords do not match' } }); return }
    if(pwd.new_password.length < 6) { setStatus({ pwd: { ok:false, msg:'Password must be at least 6 characters' } }); return }
    try {
      await api.put('/auth/profile', { password: pwd.password, new_password: pwd.new_password })
      setPwd({ password:'', new_password:'', confirm:'' })
      setStatus({ pwd: { ok:true, msg:'Password changed!' } })
    } catch(e) { setStatus({ pwd: { ok:false, msg:e.response?.data?.error||'Error' } }) }
  }

  const markAll = async () => {
    await api.post('/notifications/read-all')
    setNotifs(n=>n.map(x=>({...x,is_read:1})))
  }

  const initials = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'U'

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-muted mt-0.5">Manage your profile, appearance, and preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <User size={18} className="text-indigo-500"/>
          <h2 className="section-title">Profile</h2>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
               style={{background:profile.avatar_color}}>
            {initials}
          </div>
          <div className="flex-1">
            <label className="label">Display Name</label>
            <input className="input" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/>
          </div>
        </div>
        <div>
          <label className="label">Avatar Colour</label>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map(c=>(
              <button key={c} onClick={()=>setProfile({...profile,avatar_color:c})}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${profile.avatar_color===c?'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-indigo-500 scale-110':''}`}
                style={{background:c}}/>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input opacity-60 cursor-not-allowed" value={user?.email||''} readOnly/>
        </div>
        {status.profile && (
          <div className={`flex items-center gap-2 text-sm ${status.profile.ok?'text-emerald-600 dark:text-emerald-400':'text-red-500'}`}>
            {status.profile.ok?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>}{status.profile.msg}
          </div>
        )}
        <button onClick={saveProfile} className="btn-primary"><Save size={15}/>Save Profile</button>
      </div>

      {/* Password */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <Lock size={18} className="text-indigo-500"/>
          <h2 className="section-title">Change Password</h2>
        </div>
        {[['password','Current Password'],['new_password','New Password'],['confirm','Confirm New Password']].map(([k,l])=>(
          <div key={k}>
            <label className="label">{l}</label>
            <input className="input" type="password" placeholder="••••••••" value={pwd[k]}
              onChange={e=>setPwd({...pwd,[k]:e.target.value})}/>
          </div>
        ))}
        {status.pwd && (
          <div className={`flex items-center gap-2 text-sm ${status.pwd.ok?'text-emerald-600 dark:text-emerald-400':'text-red-500'}`}>
            {status.pwd.ok?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>}{status.pwd.msg}
          </div>
        )}
        <button onClick={savePassword} className="btn-primary"><Save size={15}/>Change Password</button>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette size={18} className="text-indigo-500"/>
          <h2 className="section-title">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Theme</p>
            <p className="text-xs text-muted mt-0.5">Currently: {theme==='dark'?'Dark Mode':'Light Mode'}</p>
          </div>
          <button onClick={toggle} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-colors ${theme==='dark'?'border-slate-600 text-slate-300 hover:bg-slate-700':'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
            {theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}
            Switch to {theme==='dark'?'Light':'Dark'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-indigo-500"/>
            <h2 className="section-title">Notifications</h2>
          </div>
          <button onClick={markAll} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">Mark all read</button>
        </div>
        {nloading ? <p className="text-center text-muted py-6">Loading…</p>
        : notifs.length===0 ? <p className="text-center text-muted py-8">No notifications</p>
        : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-72 overflow-y-auto">
            {notifs.map(n=>(
              <div key={n.id} className={`px-5 py-3.5 ${!n.is_read?'bg-indigo-50/40 dark:bg-indigo-900/10':''}`}>
                <div className="flex items-start gap-2">
                  {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"/>}
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.created_at?.slice(0,16)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="section-title mb-4">About OPA Insight</h2>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p><span className="font-medium">Version:</span> 2.0.0</p>
          <p><span className="font-medium">Course:</span> XBAU3064N Project 2 — UBCSW</p>
          <p><span className="font-medium">Stack:</span> React 18 + Vite · Python Flask · SQLite · Recharts · ReportLab</p>
          <p><span className="font-medium">Supported file types:</span> CSV, XLSX/XLS, DOCX/DOC</p>
          <p><span className="font-medium">Categories:</span> 10 product categories with 300+ keywords</p>
        </div>
      </div>
    </div>
  )
}
