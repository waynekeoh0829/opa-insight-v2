import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Search, RefreshCw } from 'lucide-react'
import api from '../utils/api'

const CAT_COLORS = {
  'Electronics':'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Fashion':'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Health & Beauty':'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'Home & Living':'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Sports & Outdoors':'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Books & Stationery':'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Food & Beverages':'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Baby & Kids':'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Pet Supplies':'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Others':'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export default function CategoryPage() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [newKw, setNewKw] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await api.get('/categories')
    setData(data); setLoading(false)
    if(!selected && Object.keys(data).length) setSelected(Object.keys(data)[0])
  }
  useEffect(() => { load() }, [])

  const addKw = async () => {
    if(!newKw.trim()||!selected) return
    setSaving(true)
    await api.post(`/categories/${encodeURIComponent(selected)}/keywords`, { keyword: newKw.trim() })
    setNewKw(''); await load(); setSaving(false)
  }
  const delKw = async (cat, kw) => {
    await api.delete(`/categories/${encodeURIComponent(cat)}/keywords/${encodeURIComponent(kw)}`)
    load()
  }

  const cats = Object.keys(data)
  const keywords = (data[selected] || []).filter(k => !search || k.includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Category Management</h1>
        <p className="text-muted mt-0.5">Manage keywords used to auto-categorise products. Changes apply to future uploads.</p>
      </div>

      {loading ? <div className="card p-8 text-center text-muted">Loading…</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Category list */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <p className="section-title text-sm">Categories</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {cats.map(cat => (
                <button key={cat} onClick={()=>setSelected(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${selected===cat?'bg-indigo-50 dark:bg-indigo-900/20':''}`}>
                  <div className="flex items-center gap-2.5">
                    <Tag size={14} className={selected===cat?'text-indigo-500':'text-slate-400'}/>
                    <span className={`text-sm font-medium ${selected===cat?'text-indigo-600 dark:text-indigo-400':'text-slate-700 dark:text-slate-300'}`}>{cat}</span>
                  </div>
                  <span className="text-xs text-muted">{(data[cat]||[]).length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Keywords panel */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="section-title">{selected}</p>
                <p className="text-xs text-muted mt-0.5">{keywords.length} keyword{keywords.length!==1?'s':''}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CAT_COLORS[selected]||'badge-slate'}`}>{selected}</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Add keyword */}
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Add new keyword (e.g. airpods)…" value={newKw}
                  onChange={e=>setNewKw(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addKw()}/>
                <button onClick={addKw} disabled={saving||!newKw.trim()} className="btn-primary">
                  <Plus size={15}/>{saving?'Saving…':'Add'}
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input className="input pl-8" placeholder="Search keywords…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>

              {/* Keywords grid */}
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                {keywords.length===0 ? (
                  <p className="text-muted text-sm w-full py-4 text-center">No keywords found</p>
                ) : keywords.map(kw=>(
                  <div key={kw} className="group flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-3 py-1.5 transition-colors">
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400">{kw}</span>
                    <button onClick={()=>delKw(selected,kw)} className="text-slate-400 hover:text-red-500 transition-colors ml-0.5">
                      <Trash2 size={11}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
              <p className="text-xs text-muted">Tip: Keywords are matched as substrings. "phone" matches "iPhone 15 Pro". Keywords are case-insensitive.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
