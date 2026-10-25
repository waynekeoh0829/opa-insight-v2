export default function KPICard({ title, value, icon:Icon, color='indigo', sub, trend }) {
  const c = {
    indigo:{bg:'rgba(76,113,255,.12)',icon:'#4C71FF',bdr:'rgba(76,113,255,.2)'},
    teal:  {bg:'rgba(0,212,196,.1)', icon:'#00D4C4',bdr:'rgba(0,212,196,.2)'},
    amber: {bg:'rgba(245,158,11,.1)',icon:'#F59E0B',bdr:'rgba(245,158,11,.2)'},
    red:   {bg:'rgba(239,68,68,.1)', icon:'#EF4444',bdr:'rgba(239,68,68,.2)'},
    green: {bg:'rgba(34,197,94,.1)', icon:'#22C55E',bdr:'rgba(34,197,94,.2)'},
    purple:{bg:'rgba(139,92,246,.1)',icon:'#8B5CF6',bdr:'rgba(139,92,246,.2)'},
  }[color] || {bg:'rgba(76,113,255,.12)',icon:'#4C71FF',bdr:'rgba(76,113,255,.2)'}

  const trendColor = trend > 0 ? '#4ADE80' : trend < 0 ? '#F87171' : null
  const trendLabel = trend != null ? `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%` : null

  return (
    <div className="card slide-up p-5" style={{borderColor:c.bdr}}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>{title}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{background:c.bg}}>
          <Icon size={16} style={{color:c.icon}} />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1" style={{color:'var(--text)'}}>{value}</p>
      <div className="flex items-center gap-2">
        {sub && <p className="text-xs" style={{color:'var(--muted)'}}>{sub}</p>}
        {trendLabel && (
          <span className="text-xs font-semibold" style={{color:trendColor}}>{trendLabel} vs last period</span>
        )}
      </div>
    </div>
  )
}
