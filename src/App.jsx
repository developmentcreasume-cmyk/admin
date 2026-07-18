import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Overview from './pages/Overview.jsx'
import Creators from './pages/Creators.jsx'
import CreatorDetail from './pages/CreatorDetail.jsx'
import Enquiries from './pages/Enquiries.jsx'
import Plans from './pages/Plans.jsx'
import Payments from './pages/Payments.jsx'
import Benchmark from './pages/Benchmark.jsx'
import Referrals from './pages/Referrals.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="creators" element={<Creators />} />
        <Route path="creators/:id" element={<CreatorDetail />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="plans" element={<Plans />} />
        <Route path="payments" element={<Payments />} />
        <Route path="benchmark" element={<Benchmark />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
