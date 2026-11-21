import RepeatableRows from '@/components/clientportal/RepeatableRows';
import { Section, ReminderChip, inputCls, InternalBadge } from './DiscoveryField';

export const DEPT_OPTIONS = ['Sales', 'Support', 'Finance', 'HR', 'Merchandising', 'Operations', 'Procurement', 'IT', 'Marketing', 'Admin', 'Legal', 'Other'];

export default function SectionA({ useCase, department, portalClient, meeting, changeMeeting, changeUseCase, changeDept, flush }) {
  return (
    <Section id="sec-a" title="Section A — Process Identity" subtitle="First 10 minutes of the meeting">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">Client (auto-linked)</label>
          <div className={`${inputCls} bg-secondary/40 text-muted-foreground`}>{portalClient?.client_name || '—'}</div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">Department (linked from use case)</label>
          <div className={`${inputCls} bg-secondary/40 text-muted-foreground`}>{department?.department_name || '—'}</div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">Process name</label>
          <input defaultValue={useCase.process_name} onChange={e => changeUseCase('process_name', e.target.value)} onBlur={flush} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">Employee count in this department (A7)</label>
          <input type="number" defaultValue={department?.employee_count} onChange={e => changeDept('employee_count', parseFloat(e.target.value) || 0)} onBlur={flush} className={inputCls} />
        </div>
      </div>

      <RepeatableRows
        entityName="PortalProcessOwner" parentField="use_case_id" parentId={useCase.id}
        extraQuery={{ person_type: 'Process Owner' }}
        title="Process Owner(s) (A4)" addLabel="Add Another Owner"
        columns={[
          { key: 'person_name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'contact', label: 'Phone / Email' },
        ]}
      />
      <div className="rounded-xl bg-amber-500/[0.07] border border-amber-500/15 p-3">
        <RepeatableRows
          entityName="PortalProcessOwner" parentField="use_case_id" parentId={useCase.id}
          extraQuery={{ person_type: 'Decision Maker' }}
          defaults={{ visibility: 'Internal-only' }}
          title={<>Meeting Sponsor(s) / Decision Maker(s) (A5) <InternalBadge /></>} addLabel="Add Another Decision Maker"
          columns={[
            { key: 'person_name', label: 'Name' },
            { key: 'role', label: 'Role' },
          ]}
        />
      </div>
      <RepeatableRows
        entityName="PortalProcessOwner" parentField="use_case_id" parentId={useCase.id}
        extraQuery={{ person_type: 'Stakeholder' }}
        title="Stakeholders (A6)" addLabel="Add Another Stakeholder"
        columns={[
          { key: 'person_name', label: 'Name' },
          { key: 'department', label: 'Department', type: 'select', options: DEPT_OPTIONS },
          { key: 'role', label: 'Role' },
          { key: 'enters_at_step', label: 'Enters at which step' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">Discovery date (A8)</label>
          <input type="date" value={meeting.meeting_date || ''} onChange={e => { changeMeeting('meeting_date', e.target.value); flush(); }} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">Clara team present (comma separated)</label>
          <input defaultValue={(meeting.clara_team_present || []).join(', ')}
            onBlur={e => { changeMeeting('clara_team_present', e.target.value.split(',').map(s => s.trim()).filter(Boolean)); flush(); }}
            className={inputCls} placeholder="Yogansh, Laksh, Siddhi" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">Meeting recording link (A9 — post-meeting)</label>
          <input defaultValue={meeting.recording_link} onChange={e => changeMeeting('recording_link', e.target.value)} onBlur={flush} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">Meeting notes / transcript link (A10 — post-meeting)</label>
          <input defaultValue={meeting.transcript_link} onChange={e => changeMeeting('transcript_link', e.target.value)} onBlur={flush} className={inputCls} placeholder="https://..." />
        </div>
      </div>

      <ReminderChip>Before leaving this section: ask "Who else touches this process between any two steps?" — teams discovered late cost a full iteration.</ReminderChip>
    </Section>
  );
}