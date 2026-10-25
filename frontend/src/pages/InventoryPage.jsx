import { useState, useEffect } from 'react'
import { Package, AlertTriangle, TrendingUp, BarChart3, RefreshCw } from 'lucide-react'
import api from '../utils/api'

const fmtRM = n => `RM ${Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`

export default function InventoryPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try { const {data:d}=await api.get('/inventory'); setData(d) } catch{}
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const items = (data?.items||[]).filter(i=>!search||i.product_name.toLowerCase().includes(search.toLowerCase()))
  const restock = data?.restock_needed||[]
  const summary = data?.summary||{}
  const display = tab==='all'?items:restock.filter(i=>!search||i.product_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Inventory Tracker</h1>
          <p className="text-muted mt-0.5">Product velocity, stock levels, and restock alerts</p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <RefreshCw size={15} className={loading?'animate-spin':''}/>Refresh
        </button>
      </div>

      {loading ? <div className="card p-8 text-center text-muted">Loading inventory…</div> : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Total SKUs', summary.total_skus||0, Package, 'bg-indigo-500'],
              ['Restock Alerts', summary.restock_alert_count||0, AlertTriangle, 'bg-red-500'],
              ['Top Velocity', `${summary.top_velocity?.toFixed(2)||0}/day`, TrendingUp, 'bg-emerald-500'],
              ['Date Range', `${summary.date_range_days||0} days`, BarChart3, 'bg-violet-500'],
            ].map(([l,v,Icon,c])=>(
              <div key={l} className="card p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${c} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className="text-white"/>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{l}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{v}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Restock alert banner */}
          {restock.length>0 && (
            <div className="card p-4 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-500"/>
                <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">{restock.length} product(s) need restocking within 14 days</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {restock.slice(0,5).map(r=>(
                  <span key={r.product_name} className="badge-amber">{r.product_name} ({r.days_stock_left?.toFixed(0)} days)</span>
                ))}
                {restock.length>5 && <span className="text-xs text-amber-600 dark:text-amber-400 self-center">+{restock.length-5} more</span>}
              </div>
            </div>
          )}

          {/* Tab + Search */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[['all','All Products'],['restock','Restock Needed']].map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t?'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm':'text-muted hover:text-slate-700 dark:hover:text-slate-200'}`}>
                  {l} {t==='restock'&&restock.length>0&&<span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{restock.length}</span>}
                </button>
              ))}
            </div>
            <input className="input w-64" placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">Category</th>
                  <th className="table-header text-right">Total Revenue</th>
                  <th className="table-header text-right">Units Sold</th>
                  <th className="table-header text-right">Daily Velocity</th>
                  <th className="table-header text-right">Est. Days Left</th>
                  <th className="table-header">Last Sale</th>
                  <th className="table-header">Status</th>
                </tr></thead>
                <tbody>
                  {display.slice(0,50).map((item,i)=>{
                    const days=item.days_stock_left
                    const status=days<7?'badge-red':days<14?'badge-amber':'badge-green'
                    const statusLabel=days<7?'Critical':days<14?'Low Stock':'OK'
                    return (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="table-cell font-medium max-w-[160px]"><p className="truncate">{item.product_name}</p></td>
                        <td className="table-cell"><span className="badge-indigo text-[10px]">{item.category}</span></td>
                        <td className="table-cell text-right font-semibold text-indigo-600 dark:text-indigo-400">{fmtRM(item.total_rev)}</td>
                        <td className="table-cell text-right">{item.total_qty?.toLocaleString()}</td>
                        <td className="table-cell text-right font-medium">{item.daily_velocity}/day</td>
                        <td className="table-cell text-right font-medium">{days>=999?'—':Math.round(days)}</td>
                        <td className="table-cell text-muted">{item.last_sale}</td>
                        <td className="table-cell"><span className={status}>{statusLabel}</span></td>
                      </tr>
                    )
                  })}
                  {display.length===0 && (
                    <tr><td colSpan="8" className="table-cell text-center py-12 text-muted">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
