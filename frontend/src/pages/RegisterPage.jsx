import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { TrendingUp, User, Mail, Lock, CheckCircle2, XCircle } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth(); const nav = useNavigate()
  const checks = [
    { ok: form.password.length >= 6, label:'At least 6 characters' },
    { ok: /[A-Z]/.test(form.password), label:'One uppercase letter' },
    { ok: form.password === form.confirm && form.confirm.length > 0, label:'Passwords match' },
  ]
  const submit = async e => {
    e.preventDefault(); setError('')
    if (!checks.every(c=>c.ok)) { setError('Password requirements not met'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { name:form.name, email:form.email, password:form.password })
      login(data.token, data.user); nav('/dashboard')
    } catch (err) { setError(err.response?.data?.error || 'Registration failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="text-indigo-400" size={22}/>
          <span className="text-white font-bold text-lg">OPA Insight</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
        <p className="text-slate-400 text-sm mb-8">Join OPA Insight to get started</p>
        {error && <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          {[['Name','name','text',User,'Your full name'],['Email','email','email',Mail,'your@email.com']].map(([l,f,t,Icon,ph])=>(
            <div key={f}>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">{l}</label>
              <div className="relative">
                <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type={t} placeholder={ph} value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})} required/>
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Confirm Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                type="password" placeholder="Repeat password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} required/>
            </div>
          </div>
          {form.password && (
            <div className="space-y-1.5 bg-slate-800/50 rounded-xl p-3">
              {checks.map(c=>(
                <div key={c.label} className="flex items-center gap-2 text-xs">
                  {c.ok ? <CheckCircle2 size={13} className="text-emerald-400"/> : <XCircle size={13} className="text-slate-600"/>}
                  <span className={c.ok ? 'text-emerald-400' : 'text-slate-500'}>{c.label}</span>
                </div>
              ))}
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-3 transition-colors duration-150 disabled:opacity-60">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
