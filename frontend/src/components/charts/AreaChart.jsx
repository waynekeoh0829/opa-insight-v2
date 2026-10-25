import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-4 py-3 text-sm">
      <p style={{color:'var(--muted)'}} className="mb-1">{label}</p>
      <p className="font-bold" style={{color:'#4C71FF'}}>
        RM {Number(payload[0]?.value).toLocaleString('en-MY',{minimumFractionDigits:2})}
      </p>
      {payload[1] && <p className="text-xs" style={{color:'var(--muted)'}}>{payload[1].value} orders</p>}
    </div>
  )
}

export default function RevAreaChart({ data=[], type='monthly' }) {
  const formatted = data.map(d => ({
    ...d, label: d.Week || d.Month || '',
    revenue: Number(d.revenue)||0, orders: Number(d.orders)||0,
  }))
  if (!formatted.length) return (
    <div className="flex items-center justify-center h-52 text-sm" style={{color:'var(--muted)'}}>
      No trend data available
    </div>
  )
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{top:5,right:5,left:0,bottom:5}}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4C71FF" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#4C71FF" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="label" tick={{fill:'var(--muted)',fontSize:11}} tickLine={false} axisLine={false}
               tickFormatter={v => v.length>7 ? v.slice(0,7) : v} />
        <YAxis tick={{fill:'var(--muted)',fontSize:11}} tickLine={false} axisLine={false}
               tickFormatter={v => `RM${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CT/>} />
        <Area type="monotone" dataKey="revenue" stroke="#4C71FF" strokeWidth={2.5}
              fill="url(#rg)" dot={false} activeDot={{r:5,fill:'#4C71FF'}} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
