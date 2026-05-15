import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import NewEmployee from './pages/NewEmployee'
import Workflows from './pages/Workflows'
import ITApprovals from './pages/ITApprovals'
import ITApprovalSingle from './pages/ITApprovalSingle'
import HRApprovals from './pages/HRApprovals'
import HRApprovalSingle from './pages/HRApprovalSingle'
import Approvals from './pages/Approvals'
import AuditLogs from './pages/AuditLogs'
import AccessRightsPortal from './pages/AccessRightsPortal'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
        fontSize: 14, color: 'var(--text-muted)',
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const isManager = user?.email === 'sriharshanandiraju@gmail.com' || user?.email?.includes('manager');
  const isITAdmin = user?.email === 'harsha.ti.app' || user?.email === 'harsha.ti.app@gmail.com';
  const isHRAdmin = user?.email === 'harsha.hr.ti@gmail.com';
  const isApprovalsPage = location.pathname === '/approvals';
  const isITApprovalsPage = location.pathname === '/it-approvals';
  const isHRApprovalsPage = location.pathname === '/hr-approvals';

  // If user is a manager and trying to access anything other than approvals, redirect them
  if (isManager && !isApprovalsPage) {
    return <Navigate to="/approvals" replace />;
  }

  // If user is trying to access IT approvals but is not the IT admin, redirect to home
  if (isITApprovalsPage && !isITAdmin) {
    return <Navigate to="/" replace />;
  }

  // If user is trying to access HR approvals but is not the HR admin, redirect to home
  if (isHRApprovalsPage && !isHRAdmin) {
    return <Navigate to="/" replace />;
  }

  return children
}

export default function App() {
  const { user } = useAuth();
  const isManager = user?.email === 'sriharshanandiraju@gmail.com' || user?.email?.includes('manager');

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>{isManager ? <Navigate to="/approvals" replace /> : <Dashboard />}</Layout>
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute>
          <Layout><Employees /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/employees/:id" element={
        <ProtectedRoute>
          <Layout><EmployeeDetail /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/new" element={
        <ProtectedRoute>
          <Layout><NewEmployee /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/workflows" element={
        <ProtectedRoute>
          <Layout><Workflows /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/it-approvals" element={
        <ProtectedRoute>
          <Layout><ITApprovals /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/it-approvals/:employeeId" element={
        <ProtectedRoute>
          <Layout><ITApprovalSingle /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/hr-approvals" element={
        <ProtectedRoute>
          <Layout><HRApprovals /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/hr-approvals/:employeeId" element={
        <ProtectedRoute>
          <Layout><HRApprovalSingle /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/approvals" element={
        <Approvals />
      } />
      <Route path="/audit" element={
        <ProtectedRoute>
          <Layout><AuditLogs /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/onboarding-portal/:employeeId" element={
        <ProtectedRoute>
          <Layout><AccessRightsPortal /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
