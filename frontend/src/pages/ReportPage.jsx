import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, FileText, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import api from '../utils/api'

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16','#f97316','#14b8a6']
const fmtRM = n => `RM ${Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`

function CompareCard({ label, val1, val2, change, prefix='RM ' }) {
  const up = change > 0; const down = change < 0
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted mb-1">Period 1</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{prefix}{Number(val1||0).toLocaleString('en-MY',{minimumFractionDigits:prefix==='RM '?2:0})}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${up?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400':down?'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
          {up?<ArrowUpRight size={14}/>:down?<ArrowDownRight size={14}/>:<Minus size={14}/>}
          {Math.abs(change||0).toFixed(1)}%
        </div>
        <div className="text-right">
          <p className="text-xs text-muted mb-1">Period 2</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{prefix}{Number(val2||0).toLocaleString('en-MY',{minimumFractionDigits:prefix==='RM '?2:0})}</p>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const [analytics, setAnalytics] = useState(null)
  const [insights, setInsights] = useState([])
  const [recs, setRecs] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [compare, setCompare] = useState(null)
  const [cmp, setCmp] = useState({ from1:'', to1:'', from2:'', to2:'' })
  const [showCompare, setShowCompare] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const p = dateFrom && dateTo ? `?from=${dateFrom}&to=${dateTo}` : ''
    try {
      const [an, ins, r, anom] = await Promise.all([
        api.get(`/analytics${p}`), api.get(`/insights${p}`),
        api.get(`/recommendations${p}`), api.get(`/anomalies${p}`)
      ])
      setAnalytics(an.data); setInsights(ins.data); setRecs(r.data); setAnomalies(anom.data)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const runCompare = async () => {
    if(!cmp.from1||!cmp.to1||!cmp.from2||!cmp.to2) return
    const {data} = await api.get(`/compare?from1=${cmp.from1}&to1=${cmp.to1}&from2=${cmp.from2}&to2=${cmp.to2}`)
    setCompare(data)
  }

  const exportPDF = async () => {
    setExporting(true)
    try {
      const p = dateFrom && dateTo ? `?from=${dateFrom}&to=${dateTo}` : ''
      const res = await api.get(`/export/pdf${p}`, { responseType:'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href=url; a.download=`OPA_Report_${Date.now()}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { alert('Export failed') }
    setExporting(false)
  }

  const exportCSV = async () => {
    const p = dateFrom && dateTo ? `?from=${dateFrom}&to=${dateTo}` : ''
    const res = await api.get(`/export/csv${p}`, { responseType:'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href=url; a.download=`OPA_Data_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const kpi = analytics?.kpi || {}
  const cats = analytics?.categories || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-muted mt-0.5">Comprehensive analytics and export</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="btn-ghost border border-slate-200 dark:border-slate-700">
            <FileText size={15}/>Export CSV
          </button>
          <button onClick={exportPDF} disabled={exporting} className="btn-primary">
            <Download size={15}/>{exporting?'Generating…':'Export PDF'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card px-5 py-4 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Date range:</span>
        <input type="date" className="input w-40" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
        <span className="text-muted">to</span>
        <input type="date" className="input w-40" value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
        <button onClick={fetchAll} className="btn-primary">Apply</button>
        <button onClick={()=>{setDateFrom('');setDateTo('');fetchAll()}} className="btn-ghost">Clear</button>
        <button onClick={()=>setShowCompare(!showCompare)} className="btn-ghost border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 ml-auto">
          <TrendingUp size={15}/>Period Comparison
        </button>
      </div>

      {/* Period comparison */}
      {showCompare && (
        <div className="card p-5 space-y-4">
          <h2 className="section-title">Period-over-Period Comparison</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label">Period 1</p>
              <div className="flex gap-2">
                <input type="date" className="input" value={cmp.from1} onChange={e=>setCmp({...cmp,from1:e.target.value})}/>
                <input type="date" className="input" value={cmp.to1} onChange={e=>setCmp({...cmp,to1:e.target.value})}/>
              </div>
            </div>
            <div>
              <p className="label">Period 2</p>
              <div className="flex gap-2">
                <input type="date" className="input" value={cmp.from2} onChange={e=>setCmp({...cmp,from2:e.target.value})}/>
                <input type="date" className="input" value={cmp.to2} onChange={e=>setCmp({...cmp,to2:e.target.value})}/>
              </div>
            </div>
          </div>
          <button onClick={runCompare} className="btn-primary">Compare Periods</button>
          {compare && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <CompareCard label="Revenue" val1={compare.period1?.kpi?.revenue} val2={compare.period2?.kpi?.revenue} change={compare.change?.revenue} prefix="RM "/>
              <CompareCard label="Orders" val1={compare.period1?.kpi?.orders} val2={compare.period2?.kpi?.orders} change={compare.change?.orders} prefix=""/>
              <CompareCard label="Avg Order Value" val1={compare.period1?.kpi?.avg_order} val2={compare.period2?.kpi?.avg_order} change={compare.change?.avg_order} prefix="RM "/>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><p className="text-muted">Loading report…</p></div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[['Total Revenue', fmtRM(kpi.total_revenue), 'bg-indigo-500'],
              ['Total Orders', kpi.total_orders?.toLocaleString()||'0', 'bg-violet-500'],
              ['Total GST', fmtRM(kpi.total_gst), 'bg-cyan-500'],
              ['Avg Order', fmtRM(kpi.avg_order_value), 'bg-emerald-500']
            ].map(([l,v,c])=>(
              <div key={l} className="card p-5">
                <div className={`w-2 h-8 ${c} rounded-full mb-3`}/>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{l}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{v}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {analytics?.trend?.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Monthly Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics.trend}>
                  <defs>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3}/>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:'#64748b'}} tickLine={false} axisLine={false}/>
                  <YAxis tick={{fontSize:11,fill:'#64748b'}} tickLine={false} axisLine={false} tickFormatter={v=>`RM${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={(v)=>[fmtRM(v),'Revenue']}/>
                  <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#g2)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category table */}
          {cats.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="section-title">Category Revenue Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="table-header">Category</th>
                    <th className="table-header text-right">Revenue</th>
                    <th className="table-header text-right">Orders</th>
                    <th className="table-header text-right">% Share</th>
                    <th className="table-header">Distribution</th>
                  </tr></thead>
                  <tbody>
                    {cats.map((c,i)=>(
                      <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                            {c.category}
                          </div>
                        </td>
                        <td className="table-cell text-right font-semibold text-indigo-600 dark:text-indigo-400">{fmtRM(c.revenue)}</td>
                        <td className="table-cell text-right">{c.orders?.toLocaleString()}</td>
                        <td className="table-cell text-right font-medium">{c.pct?.toFixed(1)}%</td>
                        <td className="table-cell w-40">
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{width:`${c.pct}%`,background:COLORS[i%COLORS.length]}}/>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Insights + Recs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="section-title mb-4">AI Insights</h2>
              <ol className="space-y-3">
                {insights.map((ins,i)=>(
                  <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-indigo-500 w-5 flex-shrink-0">{i+1}.</span>{ins}
                  </li>
                ))}
              </ol>
            </div>
            <div className="card p-5">
              <h2 className="section-title mb-4">Recommended Actions</h2>
              <ol className="space-y-3">
                {recs.map((r,i)=>(
                  <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-emerald-500 w-5 flex-shrink-0">{i+1}.</span>{r}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Top products bar chart */}
          {analytics?.top_products?.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Top 10 Products by Revenue</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.top_products.slice(0,10)} layout="vertical" margin={{left:0,right:20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:10,fill:'#64748b'}} tickLine={false} axisLine={false} tickFormatter={v=>`RM${(v/1000).toFixed(0)}k`}/>
                  <YAxis type="category" dataKey="product_name" tick={{fontSize:9.5,fill:'#94a3b8'}} tickLine={false} axisLine={false} width={110}/>
                  <Tooltip formatter={(v)=>[fmtRM(v),'Revenue']}/>
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0,6,6,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
