import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { User, Mail, Calendar, Zap, CheckCircle2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { employeeApi, managerApi } from '../api/client'
import { Card, Button, Input, Select, PageHeader, Spinner } from '../components/UI'

const LAPTOPS = ['MacBook Pro 14"', 'MacBook Air M2', 'MacBook Air M3', 'Dell XPS 15', 'ThinkPad X1 Carbon', 'HP EliteBook 840']
const OFFICES = ['Hyderabad HQ', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Remote']

const DEMO_DATA = [
  { name: 'Priya Nair', email: 'priya.nair@company.com', department: 'Engineering / Product Development', role: 'Senior Software Engineer', joiningDate: '', laptopModel: 'MacBook Pro 14"', officeLocation: 'Hyderabad HQ' },
  { name: 'Ravi Shankar', email: 'ravi.shankar@company.com', department: 'Product / Business Analysis / UX', role: 'Product Manager', joiningDate: '', laptopModel: 'MacBook Air M2', officeLocation: 'Bangalore' },
  { name: 'Divya Krishnan', email: 'divya.k@company.com', department: 'Product / Business Analysis / UX', role: 'UI/UX Designer', joiningDate: '', laptopModel: 'MacBook Air M3', officeLocation: 'Mumbai' },
]

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
        color: 'var(--text-dim)', marginBottom: 16, paddingBottom: 10,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-1)' }} />
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

export default function NewEmployee() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [manager, setManager] = useState(null)
  const [managerLoading, setManagerLoading] = useState(false)
  const [orgStructure, setOrgStructure] = useState([])
  const [orgLoading, setOrgLoading] = useState(true)

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: '', email: '', department: '', role: '',
    joiningDate: defaultDate, laptopModel: '', officeLocation: '',
  })

  const { user } = useAuth()
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: f.name || user.full_name || '',
        email: f.email || user.email || '',
      }))
    }
  }, [user])

  useEffect(() => {
    managerApi.getOrgStructure()
      .then((res) => setOrgStructure(res.data || []))
      .catch((err) => {
        console.error('Error fetching org structure:', err)
        setOrgStructure([])
      })
      .finally(() => setOrgLoading(false))
  }, [])

  const departments = orgStructure.map((group) => group.department)
  const rolesForDepartment = orgStructure.find((group) => group.department === form.department)?.roles || []
  const selectedRole = rolesForDepartment.find((role) => role.title === form.role) || null

  useEffect(() => {
    if (!form.role || !form.department) {
      setManager(null)
      setManagerLoading(false)
      return
    }

    if (selectedRole?.manager) {
      setManager(selectedRole.manager)
      setManagerLoading(false)
      return
    }

    setManagerLoading(true)
    managerApi.getByRole(form.role, form.department)
      .then(res => {
        setManager(res.data || null)
      })
      .catch(err => {
        console.error('Error fetching manager:', err)
        setManager(null)
      })
      .finally(() => setManagerLoading(false))
  }, [form.role, form.department, selectedRole])

  const set = (field) => (e) => {
    const value = e.target.value
    setForm(f => ({
      ...f,
      [field]: value,
      ...(field === 'department' ? { role: '' } : {}),
    }))
    setErrors(er => ({ ...er, [field]: '' }))
    if (field === 'department') {
      setManager(null)
      setErrors(er => ({ ...er, role: '' }))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'
    if (!form.department) e.department = 'Department is required'
    if (!form.role.trim()) e.role = 'Role is required'
    if (!manager) e.role = 'No manager found for this role'
    if (!form.joiningDate) e.joiningDate = 'Joining date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await employeeApi.create(form)
      toast.success(`✅ Approval request sent to ${res.data.approvalSentTo.name}`)
      navigate(`/employees/${res.data.employee.id}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    const d = DEMO_DATA[Math.floor(Math.random() * DEMO_DATA.length)]
    setForm({
      ...d,
      joiningDate: defaultDate,
    })
    setErrors({})
    toast.success('Demo data filled!')
  }

  return (
    <div className="animate-in">
      <PageHeader
        title="New Employee Onboarding"
        subtitle="Submit employee details to trigger a Temporal workflow"
      />

      {/* Temporal info */}
      <div style={{
        background: 'rgba(6,182,212,0.06)',
        border: '1px solid rgba(6,182,212,0.12)',
        borderRadius: 10, padding: '10px 18px', marginBottom: 22,
        fontSize: 12, color: 'var(--accent-1)', fontFamily: 'var(--mono)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Zap size={14} />
        <span>Use the employee's personal email here. After approvals, work credentials will be sent to that address.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Form */}
        <Card style={{ padding: '26px' }}>
          {orgLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <Spinner size={22} />
            </div>
          ) : (
            <>
          <FormSection title="Personal Information">
            <Input label="Full Name" placeholder="e.g. Priya Nair" value={form.name} onChange={set('name')} error={errors.name} icon={<User size={14} />} />
            <Input label="Personal Email" type="email" placeholder="priya@gmail.com" value={form.email} onChange={set('email')} error={errors.email} icon={<Mail size={14} />} />
          </FormSection>

          <FormSection title="Role & Department">
            <Select label="Department" value={form.department} onChange={set('department')} error={errors.department}>
              <option value="">Select department...</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </Select>
            <Select label="Job Title / Role" value={form.role} onChange={set('role')} error={errors.role} disabled={!form.department}>
              <option value="">{form.department ? 'Select role...' : 'Select department first...'}</option>
              {rolesForDepartment.map((role) => <option key={role.title} value={role.title}>{role.title}</option>)}
            </Select>
            <Input label="Joining Date" type="date" value={form.joiningDate} onChange={set('joiningDate')} error={errors.joiningDate} icon={<Calendar size={14} />} />
            <div />
          </FormSection>

          <FormSection title="Asset & Location">
            <Select label="Laptop Model" value={form.laptopModel} onChange={set('laptopModel')}>
              <option value="">Select laptop...</option>
              {LAPTOPS.map(l => <option key={l}>{l}</option>)}
            </Select>
            <Select label="Office Location" value={form.officeLocation} onChange={set('officeLocation')}>
              <option value="">Select office...</option>
              {OFFICES.map(o => <option key={o}>{o}</option>)}
            </Select>
          </FormSection>

          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <Button variant="primary" size="lg" loading={loading} onClick={handleSubmit} icon={<Zap size={15} />}>
              Start Temporal Workflow
            </Button>
            <Button variant="secondary" onClick={fillDemo} icon={<Sparkles size={14} />}>
              Fill Demo Data
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
            </>
          )}
        </Card>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Manager info */}
          {managerLoading ? (
            <Card style={{ padding: 18, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Spinner size={20} />
            </Card>
          ) : manager ? (
            <Card style={{ padding: 18, border: '1px solid rgba(16,185,129,0.2)', background: 'var(--green-dim)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <CheckCircle2 size={18} color="var(--green)" />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Manager for Approval
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: 'var(--text)' }}>
                    {manager.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--mono)' }}>
                    {manager.email}
                  </div>
                  {manager.managerRole && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Direct manager role: {manager.managerRole}
                    </div>
                  )}
                  {manager.department && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Team: {manager.department}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 8, borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                Approval request will be sent to this manager
              </div>
            </Card>
          ) : form.role ? (
            <Card style={{ padding: 18, background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>
                ⚠️ No manager found for role "{form.role}"
              </div>
            </Card>
          ) : null}

          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 16 }}>
              Workflow Steps
            </div>
            {[
              { step: 1, label: 'Manager Approval', desc: 'Sends approval request to role head' },
              { step: 2, label: 'IT Approval', desc: 'IT team approves laptop provisioning' },
              { step: 3, label: 'Email Account', desc: 'Corporate email created' },
              { step: 4, label: 'Laptop Request', desc: 'IT ticket for laptop dispatch' },
              { step: 5, label: 'Access Rights', desc: 'IAM groups, VPN, MFA configured' },
              { step: 6, label: 'Payroll', desc: 'Registered in payroll system' },
              { step: 7, label: 'Welcome Email', desc: 'Onboarding complete' },
            ].map(({ step, label, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--gradient)', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                  boxShadow: '0 2px 8px rgba(6,182,212,0.2)',
                }}>{step}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </Card>

          <Card style={{
            padding: 18,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))',
            border: '1px solid rgba(6,182,212,0.15)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 12 }}>
              Temporal Concepts
            </div>
            {[
              ['Durable Execution', 'Workflow survives crashes'],
              ['Signal API', 'Manager/IT approval via signal'],
              ['Activity Retries', 'Auto-retry on transient failures'],
              ['Timers', '24hr reminder if no approval'],
              ['Visibility', 'Live status on dashboard'],
            ].map(([title, desc]) => (
              <div key={title} style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--accent-1)', fontSize: 12, flexShrink: 0 }}>→</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{desc}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
