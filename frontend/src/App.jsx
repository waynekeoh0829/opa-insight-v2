import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import ReportPage from './pages/ReportPage'
import CategoryPage from './pages/CategoryPage'
import InventoryPage from './pages/InventoryPage'
import SettingsPage from './pages/SettingsPage'

function Protected({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace/>
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/" element={<Protected><Layout/></Protected>}>
              <Route index element={<Navigate to="/dashboard" replace/>}/>
              <Route path="dashboard"  element={<DashboardPage/>}/>
              <Route path="upload"     element={<UploadPage/>}/>
              <Route path="report"     element={<ReportPage/>}/>
              <Route path="categories" element={<CategoryPage/>}/>
              <Route path="inventory"  element={<InventoryPage/>}/>
              <Route path="settings"   element={<SettingsPage/>}/>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
