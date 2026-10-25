import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar/>
      <main className="flex-1 ml-60 p-8 overflow-auto">
        <Outlet/>
      </main>
    </div>
  )
}
