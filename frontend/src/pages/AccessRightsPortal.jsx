import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  ShieldCheck, Heart, Banknote, Users, ExternalLink, CheckCircle2,
  Plus, Trash2, Send, ArrowLeft, Building2, Award, Briefcase, FileText,
  DollarSign, Umbrella, Gift, UserCheck
} from 'lucide-react'
import { onboardingPortalApi } from '../api/client'
import { Card, Button, Avatar, Spinner, PageHeader, MonoTag } from '../components/UI'

// ────────────────────────────────────────────────────────────────────────────────
// Benefit cards data
// ────────────────────────────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: DollarSign, title: 'Compensation Structure', color: 'var(--green)',
    items: ['Base Pay (Monthly)', 'Performance Bonus (Quarterly)', 'Annual Increment (April Cycle)', 'Retention Bonus (2yr+ tenure)'],
  },
  {
    icon: Gift, title: 'Allowances', color: 'var(--amber)',
    items: ['House Rent Allowance (HRA)', 'Transport / Fuel Allowance', 'Meal Allowance', 'Internet / Work-from-Home Allowance', 'Relocation Assistance (if applicable)'],
  },
  {
    icon: Umbrella, title: 'Insurance Policy', color: 'var(--blue)',
    items: ['Group Medical Insurance (₹5L cover)', 'Life Insurance (2× annual CTC)', 'Accidental Cover (₹10L)', 'Dependent Coverage (Spouse + Children + Parents)', 'Dental & Vision (Voluntary top-up)'],
  },
  {
    icon: Award, title: 'Leave & Holidays', color: 'var(--purple)',
    items: ['24 Earned Leaves / Year', '12 Casual Leaves / Year', '10 Public Holidays', 'Maternity / Paternity Leave', 'Bereavement Leave'],
  },
  {
    icon: Briefcase, title: 'Learning & Growth', color: 'var(--accent-1)',
    items: ['Annual Learning Budget ₹50,000', 'Conference Sponsorship', 'Internal Certifications', 'Mentor Program', 'Quarterly Hackathons'],
  },
  {
    icon: Heart, title: 'Wellness & Perks', color: 'var(--pink)',
    items: ['Gym Membership Reimbursement', 'Mental Health Sessions (EAP)', 'Flexible Work Hours', 'Birthday Leave', 'Team Offsites'],
  },
]

const MS_TEAMS_LINK = 'https://teams.microsoft.com/l/team/19%3aMEEgZjRhOTkzYTMtNDBjYi00ZDRmLTg2NTMtN2QxYjFlYTk0ZjA1%40thread.tacv2/conversations?groupId=onboardflow-welcome'

export default function AccessRightsPortal() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('benefits')

  // Insurance form state
  const [dependents, setDependents] = useState([
    { sno: 1, employeeId: '', name: '', age: '', dob: '', relationship: 'Self', gender: 'Male' },
  ])
  const [insuranceSubmitting, setInsuranceSubmitting] = useState(false)

  // Banking form state
  const [banking, setBanking] = useState({
    accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branch: '', panNumber: '',
    uanNumber: '', aadharNumber: '', alternateContact: '', permanentAddress: '', personalNumber: '',
  })
  const [bankingSubmitting, setBankingSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [employeeId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await onboardingPortalApi.getData(employeeId)
      setData(res.data)
      if (res.data.dependents?.length > 0) {
        setDependents(res.data.dependents.map(d => ({
          sno: d.sno, employeeId: d.dep_employee_id || '', name: d.name,
          age: d.age || '', dob: d.dob ? d.dob.split('T')[0] : '', relationship: d.relationship, gender: d.gender,
        })))
      }
      if (res.data.bankingDetails) {
        const b = res.data.bankingDetails
        setBanking({
          accountHolderName: b.account_holder_name || '',
          bankName: b.bank_name || '',
          accountNumber: b.account_number || '',
          ifscCode: b.ifsc_code || '',
          branch: b.branch || '',
          panNumber: b.pan_number || '',
          uanNumber: b.uan_number || '',
          aadharNumber: b.aadhar_number || '',
          alternateContact: b.alternate_contact || '',
          permanentAddress: b.permanent_address || '',
          personalNumber: res.data.personalNumber || '',
        })
      }
    } catch (err) {
      toast.error('Failed to load portal data')
    } finally {
      setLoading(false)
    }
  }

  // ── Insurance handlers ──
  const addDependent = () => {
    setDependents(prev => [...prev, {
      sno: prev.length + 1, employeeId: data?.employee?.employee_id || '', name: '', age: '', dob: '', relationship: '', gender: '',
    }])
  }

  const removeDependent = (index) => {
    if (dependents.length <= 1) return
    setDependents(prev => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, sno: i + 1 })))
  }

  const updateDependent = (index, field, value) => {
    setDependents(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  const submitInsurance = async () => {
    const valid = dependents.every(d => d.name && d.relationship && d.gender)
    if (!valid) return toast.error('Please fill all required fields for each dependent')
    setInsuranceSubmitting(true)
    try {
      await onboardingPortalApi.submitInsurance(employeeId, dependents)
      toast.success('Insurance dependents submitted successfully!')
      fetchData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setInsuranceSubmitting(false)
    }
  }

  // ── Banking handlers ──
  const submitBanking = async () => {
    if (!banking.accountHolderName || !banking.bankName || !banking.accountNumber || !banking.ifscCode || !banking.personalNumber) {
      return toast.error('Please fill all required banking fields')
    }
    setBankingSubmitting(true)
    try {
      await onboardingPortalApi.submitBanking(employeeId, banking)
      toast.success('Banking details submitted! HR will send a confirmation email shortly.')
      fetchData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBankingSubmitting(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>
  if (!data) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Employee not found</div>

  const emp = data.employee
  const TABS = [
    { key: 'benefits', label: 'Benefits & Policies', icon: Award },
    { key: 'insurance', label: 'Insurance Dependents', icon: Heart },
    { key: 'banking', label: 'Banking Details', icon: Banknote },
  ]

  return (
    <div className="animate-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(`/employees/${employeeId}`)}>
          Back to Profile
        </Button>
      </div>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))',
        borderRadius: 16, padding: 28, marginBottom: 24,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <Avatar name={emp.name} size={56} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', margin: 0 }}>
              Welcome, {emp.name}!
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{emp.role} · {emp.department}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <MonoTag color="var(--green)">{emp.employee_id}</MonoTag>
              <MonoTag>{emp.work_email}</MonoTag>
            </div>
          </div>
        </div>

        {/* MS Teams Link */}
        <a href={MS_TEAMS_LINK} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, #5B5FC7, #4B53BC)', color: '#fff',
            padding: '12px 22px', borderRadius: 10, textDecoration: 'none',
            fontWeight: 700, fontSize: 13, letterSpacing: '-0.2px',
            boxShadow: '0 4px 14px rgba(91,95,199,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(91,95,199,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,95,199,0.35)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4l4 4 4-4h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
          Join Microsoft Teams Group
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 8, border: 'none',
              background: activeTab === tab.key ? 'rgba(6,182,212,0.1)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-1)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)',
              transition: 'all 0.2s',
              border: activeTab === tab.key ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.key === 'insurance' && data.insuranceSubmitted && <CheckCircle2 size={14} color="var(--green)" />}
            {tab.key === 'banking' && data.bankingSubmitted && <CheckCircle2 size={14} color="var(--green)" />}
          </button>
        ))}
      </div>

      {/* ─── Benefits Tab ─── */}
      {activeTab === 'benefits' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {BENEFITS.map((b, i) => (
            <Card key={i} style={{
              padding: 22, borderLeft: `4px solid ${b.color}`,
              animation: `fadeIn 0.4s ease ${i * 0.05}s forwards`, opacity: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${b.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <b.icon size={18} color={b.color} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{b.title}</span>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                {b.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Insurance Tab ─── */}
      {activeTab === 'insurance' && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Insurance Dependent Details</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Add all family members you wish to cover under the group medical insurance policy.
              </div>
            </div>
            {data.insuranceSubmitted && (
              <MonoTag color="var(--green)">✓ SUBMITTED</MonoTag>
            )}
          </div>

          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '50px 90px 1fr 60px 120px 120px 100px 40px',
            gap: 8, padding: '10px 12px', background: 'rgba(6,182,212,0.06)', borderRadius: 8,
            fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: 8,
          }}>
            <span>S.No</span><span>Emp ID</span><span>Name</span><span>Age</span>
            <span>DOB</span><span>Relationship</span><span>Gender</span><span></span>
          </div>

          {/* Table Rows */}
          {dependents.map((dep, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '50px 90px 1fr 60px 120px 120px 100px 40px',
              gap: 8, padding: '6px 12px', marginBottom: 4,
              borderRadius: 6, border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <input style={inputStyle} value={dep.sno} readOnly />
              <input style={inputStyle} value={dep.employeeId} onChange={e => updateDependent(i, 'employeeId', e.target.value)} placeholder="ID" />
              <input style={inputStyle} value={dep.name} onChange={e => updateDependent(i, 'name', e.target.value)} placeholder="Full Name *" />
              <input style={inputStyle} type="number" value={dep.age} onChange={e => updateDependent(i, 'age', e.target.value)} placeholder="Age" />
              <input style={inputStyle} type="date" value={dep.dob} onChange={e => updateDependent(i, 'dob', e.target.value)} />
              <select style={inputStyle} value={dep.relationship} onChange={e => updateDependent(i, 'relationship', e.target.value)}>
                <option value="">Select *</option>
                <option value="Self">Self</option>
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Father-in-law">Father-in-law</option>
                <option value="Mother-in-law">Mother-in-law</option>
              </select>
              <select style={inputStyle} value={dep.gender} onChange={e => updateDependent(i, 'gender', e.target.value)}>
                <option value="">Select *</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <button onClick={() => removeDependent(i)} style={{
                background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', opacity: dependents.length <= 1 ? 0.3 : 1,
              }} disabled={dependents.length <= 1}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addDependent}>
              Add Dependent
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              variant="primary"
              loading={insuranceSubmitting}
              icon={<Send size={14} />}
              onClick={submitInsurance}
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
            >
              Submit Insurance Form
            </Button>
          </div>
        </Card>
      )}

      {/* ─── Banking Tab ─── */}
      {activeTab === 'banking' && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Banking Details</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Please provide your bank account details for salary processing.
              </div>
            </div>
            {data.bankingSubmitted && (
              <MonoTag color="var(--green)">✓ SUBMITTED</MonoTag>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { key: 'accountHolderName', label: 'Account Holder Name *', icon: UserCheck },
              { key: 'bankName', label: 'Bank Name *', icon: Building2 },
              { key: 'accountNumber', label: 'Account Number *', icon: Banknote },
              { key: 'ifscCode', label: 'IFSC Code *', icon: FileText },
              { key: 'branch', label: 'Branch', icon: Building2 },
              { key: 'panNumber', label: 'PAN Number', icon: FileText },
              { key: 'uanNumber', label: 'UAN Number', icon: ShieldCheck },
              { key: 'aadharNumber', label: 'Aadhar Number', icon: UserCheck },
              { key: 'personalNumber', label: 'Personal Number *', icon: Users },
              { key: 'alternateContact', label: 'Alternate Contact', icon: Users },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <field.icon size={12} /> {field.label}
                </label>
                <input
                  style={{
                    ...inputStyle, width: '100%', padding: '10px 12px', fontSize: 13,
                    borderRadius: 8, border: '1px solid var(--border)',
                  }}
                  value={banking[field.key]}
                  onChange={e => setBanking(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.label.replace(' *', '')}
                />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Building2 size={12} /> Permanent Address
              </label>
              <textarea
                style={{
                  ...inputStyle, width: '100%', padding: '10px 12px', fontSize: 13,
                  borderRadius: 8, border: '1px solid var(--border)', minHeight: 80, resize: 'vertical'
                }}
                value={banking.permanentAddress}
                onChange={e => setBanking(prev => ({ ...prev, permanentAddress: e.target.value }))}
                placeholder="Enter your full permanent address"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <Button
              variant="primary"
              loading={bankingSubmitting}
              icon={<Send size={14} />}
              onClick={submitBanking}
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
            >
              Submit Banking Details
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 12,
  padding: '6px 8px',
  fontFamily: 'var(--font)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
