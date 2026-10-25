import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
const COLORS = ['#4C71FF','#00D4C4','#F59E0B','#EF4444','#8B5CF6','#10B981','#F97316','#06B6D4','#EC4899','#84CC16']

const CT = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-4 py-3 text-sm">
      <p className="font-semibold mb-1" style={{color:'var(--text)'}}>{payload[0].name}</p>
      <p style={{color:'#4C71FF'}}>RM {Number(payload[0].value).toLocaleString('en-MY',{minimumFractionDigits:2})}</p>
      <p className="text-xs" style={{color:'var(--muted)'}}>{payload[0].payload.total_orders} orders</p>
    </div>
  )
}
const lbl = ({ cx,cy,midAngle,innerRadius,outerRadius,percent }) => {
  if (percent<0.05) return null
  const R=Math.PI/180, r=innerRadius+(outerRadius-innerRadius)*0.5
  return (
    <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)}
          fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {(percent*100).toFixed(0)}%
    </text>
  )
}

export default function CategoryPie({ data=[] }) {
  const filtered = data.filter(d=>d.total_revenue>0)
  if (!filtered.length) return (
    <div className="flex items-center justify-center h-52 text-sm" style={{color:'var(--muted)'}}>No data</div>
  )
  const chart = filtered.map(d=>({name:d.Category,value:d.total_revenue,total_orders:d.total_orders}))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={chart} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
             paddingAngle={3} dataKey="value" labelLine={false} label={lbl}>
          {chart.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} stroke="transparent" />)}
        </Pie>
        <Tooltip content={<CT/>} />
        <Legend formatter={v=><span style={{color:'var(--muted)',fontSize:12}}>{v}</span>}
                iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  )
}
