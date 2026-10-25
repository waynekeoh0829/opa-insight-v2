import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { TrendingUp, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.token, data.user); nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.3),transparent_60%)]"/>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <TrendingUp className="text-white" size={20}/>
            </div>
            <span className="text-white font-bold text-lg">OPA Insight</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">Turn your orders into<br/><span className="text-indigo-300">business intelligence.</span></h1>
          <p className="text-slate-300 mt-4 text-base leading-relaxed">Upload CSV, XLSX, or Word files. Get AI insights, anomaly detection, and professional reports — all without spreadsheets.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[['📊','Smart Analytics'],['🤖','AI Insights'],['⚠️','Anomaly Detection'],['📄','PDF Reports']].map(([e,l])=>(
              <div key={l} className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3">
                <span>{e}</span><span className="text-sm text-slate-200">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-slate-500 text-sm">UBCSW • XBAU3064N • Project 2</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <TrendingUp className="text-indigo-400" size={22}/>
            <span className="text-white font-bold text-lg">OPA Insight</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to your account</p>
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">
              <AlertCircle size={15}/>{error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  type="email" placeholder="admin@opa.com" value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})} required/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  type="password" placeholder="••••••••" value={form.password}
                  onChange={e=>setForm({...form,password:e.target.value})} required/>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-3 transition-colors duration-150 disabled:opacity-60 mt-2">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-6">
            No account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one</Link>
          </p>
          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500 text-center">Default: <span className="text-slate-300">admin@opa.com</span> / <span className="text-slate-300">admin123</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
