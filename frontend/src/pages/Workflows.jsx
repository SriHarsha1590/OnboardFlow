import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useEmployees } from '../hooks/useData'
import { StatusBadge, ProgressBar, Card, Button, Avatar, Spinner, EmptyState, PageHeader, MonoTag } from '../components/UI'
import WorkflowTimeline from '../components/WorkflowTimeline'

export default function Workflows() {
  const { data, loading } = useEmployees()
  const navigate = useNavigate()

  const withWorkflows = data.filter(e => e.workflow_id)

  return (
    <div className="animate-in">
      <PageHeader
        title="Workflow Monitor"
        subtitle="Per-employee Temporal workflow activity timelines"
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : withWorkflows.length === 0 ? (
        <EmptyState
          icon="🔀"
          title="No workflows yet"
          description="Start onboarding an employee to see their workflow here"
          action={<Button variant="primary" onClick={() => navigate('/new')}>Add Employee</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
          {withWorkflows.map((emp, idx) => {
            const stepIndex = emp.current_step_index || 0
            const pct = emp.workflow_status === 'COMPLETED' ? 100 : Math.round((stepIndex / 8) * 100)

            return (
              <Card key={emp.id} style={{
                padding: 22,
                animation: `fadeIn 0.4s ease ${idx * 0.05}s forwards`,
                opacity: 0,
              }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Avatar name={emp.name} size={36} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{emp.name}</div>
                      <MonoTag>{emp.workflow_id}</MonoTag>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <StatusBadge status={emp.workflow_status} size="sm" />
                    <Button size="sm" variant="ghost" icon={<ExternalLink size={12} />} onClick={() => navigate(`/employees/${emp.id}`)}>
                      Detail
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {emp.department} · {emp.role}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>{pct}%</span>
                  </div>
                  <ProgressBar value={stepIndex} max={8} height={5} />
                </div>

                {/* Meta */}
                <div style={{
                  display: 'flex', gap: 16, marginBottom: 14,
                  fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--mono)',
                  padding: '6px 10px', background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6, border: '1px solid var(--border)',
                }}>
                  <span>task-queue: onboarding-queue</span>
                  <span>{emp.workflow_started ? formatDistanceToNow(new Date(emp.workflow_started), { addSuffix: true }) : ''}</span>
                </div>

                {/* Timeline compact */}
                <WorkflowTimeline
                  stepIndex={stepIndex}
                  workflowStatus={emp.workflow_status}
                  activities={[]}
                  compact
                />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
