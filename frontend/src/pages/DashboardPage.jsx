import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, AlertTriangle, Lightbulb, CheckSquare, Tag, RefreshCw, Bell, ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16','#f97316','#14b8a6']

const fmtRM = n => `RM ${Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtN  = n => Number(n||0).toLocaleString()

function KPICard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white"/>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend>0?'text-emerald-500':trend<0?'text-red-400':'text-slate-400'}`}>
          {trend>0?<ArrowUpRight size={13}/>:trend<0?<ArrowDownRight size={13}/>:<Minus size={13}/>}
          {trend!==0 ? `${Math.abs(trend).toFixed(1)}% vs prev period` : 'No change'}
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map(p=>(
        <p key={p.name} className="text-sm font-semibold text-white">{p.name}: {p.name.includes('Revenue') || p.name==='Revenue' ? fmtRM(p.value) : fmtN(p.value)}</p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [insights, setInsights] = useState([])
  const [recs, setRecs] = useState([])
  const [uncat, setUncat] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [chartMode, setChartMode] = useState('monthly')
  const [corrModal, setCorrModal] = useState(false)
  const [corrProduct, setCorrProduct] = useState('')
  const [corrCat, setCorrCat] = useState('')
  const [notifs, setNotifs] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const p = dateFrom && dateTo ? `?from=${dateFrom}&to=${dateTo}` : ''
    try {
      const [an, anom, ins, r, uc, nf] = await Promise.all([
        api.get(`/analytics${p}`), api.get(`/anomalies${p}`),
        api.get(`/insights${p}`), api.get(`/recommendations${p}`),
        api.get('/uncategorised'), api.get('/notifications')
      ])
      setAnalytics(an.data); setAnomalies(anom.data); setInsights(ins.data); setRecs(r.data)
      setUncat(uc.data); setNotifs(nf.data)
      setUnreadCount(nf.data.filter(n=>!n.is_read).length)
    } catch(e) { console.error(e) }
    setLoading(false)
  }, [dateFrom, dateTo])

  useEffect(() => { fetchAll() }, [fetchAll])

  const saveCorrection = async () => {
    if (!corrProduct || !corrCat) return
    await api.post('/corrections', { product_name: corrProduct, category: corrCat })
    setCorrModal(false); setCorrProduct(''); setCorrCat(''); fetchAll()
  }
  const markAllRead = async () => {
    await api.post('/notifications/read-all')
    setUnreadCount(0); setNotifs(n=>n.map(x=>({...x,is_read:1})))
  }

  const kpi = analytics?.kpi || {}
  const trend = chartMode==='monthly' ? (analytics?.trend||[]) : (analytics?.weekly||[])
  const sevBadge = { High:'badge-red', Medium:'badge-amber', Low:'badge-slate' }
  const cats10 = (analytics?.categories||[]).slice(0,10)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted mt-0.5">Here's your business overview</p>
        </div>
        <div className="flex items-center gap-3">
          {uncat.length>0 && (
            <button onClick={()=>setCorrModal(true)} className="btn-ghost border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              <Tag size={15}/>{uncat.length} Uncategorised
            </button>
          )}
          <div className="relative">
            <button onClick={()=>setShowNotifs(!showNotifs)} className="relative btn-ghost">
              <Bell size={17}/>
              {unreadCount>0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 card shadow-2xl z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</p>
                  <button onClick={markAllRead} className="text-xs text-indigo-500 hover:text-indigo-600">Mark all read</button>
                </div>
                {notifs.length===0 ? <p className="text-center text-muted py-8">No notifications</p> : notifs.slice(0,10).map(n=>(
                  <div key={n.id} className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 ${!n.is_read?'bg-indigo-50/50 dark:bg-indigo-900/10':''}`}>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.created_at?.slice(0,16)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={fetchAll} className="btn-ghost" disabled={loading}>
            <RefreshCw size={15} className={loading?'animate-spin':''}/>
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div className="card px-5 py-4 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Filter by date:</span>
        <input type="date" className="input w-40" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
        <span className="text-muted">to</span>
        <input type="date" className="input w-40" value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
        <button onClick={fetchAll} className="btn-primary">Apply</button>
        <button onClick={()=>{setDateFrom('');setDateTo('');}} className="btn-ghost">Clear</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw size={28} className="text-indigo-500 animate-spin mx-auto"/>
            <p className="text-muted mt-3">Loading analytics…</p>
          </div>
        </div>
      ) : !analytics || !kpi.total_orders ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-indigo-500"/>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No data yet</h3>
          <p className="text-muted mt-2">Upload your order data to see insights here.</p>
          <a href="/upload" className="btn-primary mx-auto mt-4 w-fit">Upload Data</a>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Revenue" value={fmtRM(kpi.total_revenue)} sub={`${fmtN(kpi.total_orders)} orders`} icon={DollarSign} color="bg-indigo-500"/>
            <KPICard label="Avg Order Value" value={fmtRM(kpi.avg_order_value)} sub="Per transaction" icon={TrendingUp} color="bg-violet-500"/>
            <KPICard label="Total GST" value={fmtRM(kpi.total_gst)} sub="Tax collected" icon={ShoppingCart} color="bg-cyan-500"/>
            <KPICard label="Anomalies" value={anomalies.length} sub={`${anomalies.filter(a=>a.severity==='High').length} high severity`} icon={AlertTriangle} color={anomalies.some(a=>a.severity==='High')?'bg-red-500':'bg-emerald-500'}/>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue trend */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Revenue Trend</h2>
                <div className="flex gap-1">
                  {['monthly','weekly'].map(m=>(
                    <button key={m} onClick={()=>setChartMode(m)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${chartMode===m?'bg-indigo-600 text-white':'text-muted hover:text-slate-900 dark:hover:text-white'}`}>
                      {m.charAt(0).toUpperCase()+m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{top:5,right:5,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5}/>
                  <XAxis dataKey={chartMode==='monthly'?'month':'week'} tick={{fontSize:11,fill:'#64748b'}} tickLine={false} axisLine={false}/>
                  <YAxis tick={{fontSize:11,fill:'#64748b'}} tickLine={false} axisLine={false} tickFormatter={v=>`RM${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category pie */}
            <div className="card p-5">
              <h2 className="section-title mb-4">Category Breakdown</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={cats10} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="revenue" nameKey="category" paddingAngle={2}>
                    {cats10.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[fmtRM(v),n]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                {cats10.map((c,i)=>(
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                      <span className="text-slate-600 dark:text-slate-300 truncate max-w-[90px]">{c.category}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">{c.pct?.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products + Anomalies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="section-title">Top Products</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Product</th>
                    <th className="table-header text-right">Revenue</th>
                    <th className="table-header text-right">Qty</th>
                  </tr></thead>
                  <tbody>
                    {(analytics?.top_products||[]).slice(0,8).map((p,i)=>(
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="table-cell w-8 text-center font-semibold text-slate-400">{i+1}</td>
                        <td className="table-cell max-w-[140px]"><p className="truncate font-medium">{p.product_name}</p></td>
                        <td className="table-cell text-right font-semibold text-indigo-600 dark:text-indigo-400">{fmtRM(p.revenue)}</td>
                        <td className="table-cell text-right text-slate-500 dark:text-slate-400">{fmtN(p.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="section-title">Anomalies</h2>
                {anomalies.length>0 && <span className="badge-red">{anomalies.length} found</span>}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-72 overflow-y-auto">
                {anomalies.length===0 ? (
                  <div className="px-5 py-8 text-center text-muted">✅ No anomalies detected</div>
                ) : anomalies.slice(0,8).map((a,i)=>(
                  <div key={i} className="px-5 py-3 flex items-start gap-3">
                    <span className={`mt-0.5 ${sevBadge[a.severity]||'badge-slate'}`}>{a.severity}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{a.type}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights + Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Lightbulb size={14} className="text-violet-600 dark:text-violet-400"/>
                </div>
                <h2 className="section-title">AI Insights</h2>
              </div>
              <div className="space-y-3">
                {insights.map((ins,i)=>(
                  <div key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="text-violet-500 font-bold flex-shrink-0 mt-0.5">{i+1}.</span>
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h2 className="section-title">Recommended Actions</h2>
              </div>
              <div className="space-y-3">
                {recs.map((r,i)=>(
                  <div key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <ChevronRight size={15} className="text-emerald-500 flex-shrink-0 mt-0.5"/>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Correction modal */}
      {corrModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={()=>setCorrModal(false)}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e=>e.stopPropagation()}>
            <h3 className="section-title mb-1">Category Correction</h3>
            <p className="text-muted mb-4">Assign correct categories to uncategorised products</p>
            <div className="mb-3">
              <label className="label">Product</label>
              <select className="input" value={corrProduct} onChange={e=>setCorrProduct(e.target.value)}>
                <option value="">Select product…</option>
                {uncat.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="label">Correct Category</label>
              <select className="input" value={corrCat} onChange={e=>setCorrCat(e.target.value)}>
                <option value="">Select category…</option>
                {['Electronics','Fashion','Health & Beauty','Home & Living','Sports & Outdoors','Books & Stationery','Food & Beverages','Baby & Kids','Pet Supplies'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={saveCorrection} className="btn-primary flex-1">Save Correction</button>
              <button onClick={()=>setCorrModal(false)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
