import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Plus, Trash2, Play, X, FileSpreadsheet, FileType } from 'lucide-react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'

const EXT_ICON = { csv: FileText, xlsx: FileSpreadsheet, xls: FileSpreadsheet, docx: FileType, doc: FileType }
const EXT_COLOR = { csv:'text-emerald-500', xlsx:'text-blue-500', xls:'text-blue-500', docx:'text-indigo-500', doc:'text-indigo-500' }

const BLANK = { order_id:'', product_name:'', quantity:'', revenue:'', gst:'', date:'' }

const STEPS = ['Validating file', 'Cleaning data', 'Categorising products', 'Computing analytics', 'Detecting anomalies', 'Generating insights', 'Finalising report']

export default function UploadPage() {
  const [tab, setTab] = useState('upload')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(null)
  const [step, setStep] = useState(-1)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [manual, setManual] = useState([{...BLANK}])
  const [manualStatus, setManualStatus] = useState(null)
  const dropRef = useRef(); const nav = useNavigate()

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try { const {data}=await api.get('/files'); setHistory(data) } catch{}
    setHistLoading(false)
  }, [])

  const onDrop = useCallback(e => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer?.files||e.target.files||[])
    const valid = dropped.filter(f=>/\.(csv|xlsx?|docx?)$/i.test(f.name))
    if(valid.length) setFiles(prev=>[...prev,...valid.map(f=>({file:f,id:Math.random()}))])
  }, [])

  const uploadAndProcess = async () => {
    setUploading(true); setResult(null)
    for(const {file,id} of files) {
      try {
        const fd = new FormData(); fd.append('file',file)
        const {data:upData} = await api.post('/upload',fd)
        setProcessing(upData.file_id)
        for(let i=0;i<STEPS.length;i++){
          setStep(i)
          await new Promise(r=>setTimeout(r,350))
        }
        const {data:procData} = await api.post(`/process/${upData.file_id}`)
        setResult({ok:true,records:procData.records,anomalies:procData.anomalies,preview:upData.preview})
      } catch(e) {
        setResult({ok:false,error:e.response?.data?.error||'Processing failed'})
      }
    }
    setFiles([]); setStep(-1); setProcessing(null); setUploading(false)
    loadHistory()
  }

  const deleteFile = async fid => {
    await api.delete(`/files/${fid}`)
    loadHistory()
  }

  const addManualRow = () => setManual(m=>[...m,{...BLANK}])
  const updateRow = (i,k,v) => setManual(m=>m.map((r,j)=>j===i?{...r,[k]:v}:r))
  const removeRow = i => setManual(m=>m.filter((_,j)=>j!==i))

  const submitManual = async () => {
    const orders = manual.filter(r=>r.product_name&&r.revenue)
    if(!orders.length) return
    try {
      await api.post('/orders/manual', { orders })
      setManualStatus({ok:true,msg:`${orders.length} order(s) saved`})
      setManual([{...BLANK}])
      loadHistory()
    } catch(e) { setManualStatus({ok:false,msg:e.response?.data?.error||'Error'}) }
  }

  const ext = f => f.name.split('.').pop().toLowerCase()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Upload Data</h1>
        <p className="text-muted mt-0.5">Import order data from CSV, Excel, Word files, or enter manually</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[['upload','File Upload'],['manual','Manual Entry'],['history','History']].map(([t,l])=>(
          <button key={t} onClick={()=>{setTab(t);if(t==='history')loadHistory()}}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t?'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm':'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab==='upload' && (
        <div className="space-y-4">
          {/* Supported formats notice */}
          <div className="card p-4 flex items-center gap-4 flex-wrap">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Supported formats:</p>
            {[['CSV','.csv'],['Excel','.xlsx / .xls'],['Word','.docx / .doc']].map(([n,e])=>(
              <span key={n} className="badge-indigo">{n} <span className="opacity-70">{e}</span></span>
            ))}
            <p className="text-xs text-muted ml-auto">Required columns: Order ID, Product Name, Quantity, Revenue, GST, Date</p>
          </div>

          {/* Drop zone */}
          <div ref={dropRef} onDrop={onDrop} onDragOver={e=>e.preventDefault()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-10 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
            onClick={()=>document.getElementById('file-input').click()}>
            <input id="file-input" type="file" className="hidden" accept=".csv,.xlsx,.xls,.docx,.doc" multiple onChange={onDrop}/>
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
              <Upload size={24} className="text-indigo-500"/>
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">Drop files here or click to browse</p>
            <p className="text-sm text-muted mt-1">CSV, XLSX, XLS, DOCX, DOC supported</p>
          </div>

          {/* File list */}
          {files.length>0 && (
            <div className="card divide-y divide-slate-100 dark:divide-slate-700/50">
              {files.map(({file,id})=>{
                const e=ext(file); const Icon=EXT_ICON[e]||FileText
                return (
                  <div key={id} className="flex items-center gap-4 px-5 py-3">
                    <Icon size={20} className={EXT_COLOR[e]||'text-slate-500'}/>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
                      <p className="text-xs text-muted">{(file.size/1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={()=>setFiles(f=>f.filter(x=>x.id!==id))} className="text-slate-400 hover:text-red-500 transition-colors"><X size={15}/></button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Processing steps */}
          {uploading && (
            <div className="card p-6">
              <p className="section-title mb-4">Processing…</p>
              <div className="space-y-2">
                {STEPS.map((s,i)=>(
                  <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i<step?'text-emerald-500':i===step?'text-indigo-500 font-medium':'text-slate-400'}`}>
                    {i<step ? <CheckCircle2 size={15}/> : i===step ? <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600"/>}
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`card p-5 border-l-4 ${result.ok?'border-emerald-500':'border-red-500'}`}>
              {result.ok ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={18} className="text-emerald-500"/>
                    <p className="font-semibold text-slate-900 dark:text-white">Processing complete!</p>
                  </div>
                  <div className="flex gap-4 text-sm text-muted mb-4">
                    <span>{result.records} records processed</span>
                    <span>{result.anomalies} anomalies detected</span>
                  </div>
                  {result.preview && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                      <table className="text-xs w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                          <tr>{Object.keys(result.preview[0]||{}).map(k=><th key={k} className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">{k}</th>)}</tr>
                        </thead>
                        <tbody>
                          {result.preview.map((row,i)=>(
                            <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                              {Object.values(row).map((v,j)=><td key={j} className="px-3 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{v}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button onClick={()=>nav('/dashboard')} className="btn-primary">View Dashboard →</button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500"/>
                  <p className="text-red-600 dark:text-red-400">{result.error}</p>
                </div>
              )}
            </div>
          )}

          {files.length>0 && !uploading && (
            <button onClick={uploadAndProcess} className="btn-primary w-full justify-center py-3">
              <Play size={16}/> Process {files.length} File{files.length>1?'s':''}
            </button>
          )}
        </div>
      )}

      {tab==='manual' && (
        <div className="space-y-4">
          <div className="card p-4 text-sm text-slate-600 dark:text-slate-300">
            Enter individual orders manually. All orders will be auto-categorised.
          </div>
          {manual.map((row,i)=>(
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Order {i+1}</p>
                {manual.length>1 && <button onClick={()=>removeRow(i)} className="text-red-400 hover:text-red-500"><Trash2 size={14}/></button>}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[['order_id','Order ID','text','ORD-001'],['product_name','Product Name','text','iPhone 15'],
                  ['quantity','Quantity','number','2'],['revenue','Revenue (RM)','number','3990'],
                  ['gst','GST (RM)','number','239.40'],['date','Date','date','']].map(([k,l,t,ph])=>(
                  <div key={k}>
                    <label className="label">{l}</label>
                    <input type={t} className="input" placeholder={ph} value={row[k]}
                      onChange={e=>updateRow(i,k,e.target.value)}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={addManualRow} className="btn-ghost"><Plus size={15}/>Add Row</button>
            <button onClick={submitManual} className="btn-primary"><CheckCircle2 size={15}/>Save All Orders</button>
          </div>
          {manualStatus && (
            <div className={`card p-4 flex items-center gap-2 text-sm ${manualStatus.ok?'border-emerald-500 border-l-4':'border-red-500 border-l-4'}`}>
              {manualStatus.ok?<CheckCircle2 size={16} className="text-emerald-500"/>:<AlertCircle size={16} className="text-red-500"/>}
              {manualStatus.msg}
            </div>
          )}
        </div>
      )}

      {tab==='history' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="section-title">Uploaded Files</h2>
            <button onClick={()=>api.post('/data/clear').then(loadHistory)} className="btn-danger text-xs">Clear All</button>
          </div>
          {histLoading ? <p className="text-center text-muted py-8">Loading…</p>
          : history.length===0 ? <p className="text-center text-muted py-12">No files uploaded yet</p>
          : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {history.map(f=>{
                const e=f.file_type||'csv'; const Icon=EXT_ICON[e]||FileText
                return (
                  <div key={f.file_id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <Icon size={18} className={EXT_COLOR[e]||'text-slate-500'}/>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{f.original_name}</p>
                      <p className="text-xs text-muted">{f.record_count} records · {f.upload_date?.slice(0,10)}</p>
                    </div>
                    <span className={f.status==='processed'?'badge-green':'badge-amber'}>{f.status}</span>
                    <button onClick={()=>deleteFile(f.file_id)} className="text-slate-400 hover:text-red-500 transition-colors ml-2"><Trash2 size={14}/></button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
