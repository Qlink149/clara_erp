import { useState, useMemo } from 'react';
import { Building2, ChevronRight, ChevronDown, Users, Layers, ListChecks, CalendarCheck } from 'lucide-react';

const STATUS_BADGE = {
  'Discovery': 'badge-cyan',
  'In Progress': 'badge-amber',
  'Delivered': 'badge-green',
  'On Hold': 'badge-gray',
};

function DeptCard({ dept, useCases, meetings, onOpen }) {
  const deptUCs = useCases.filter(u => u.department_id === dept.id);
  const ucIds = new Set(deptUCs.map(u => u.id));
  const completedMeetings = meetings.filter(m => ucIds.has(m.use_case_id) && m.status === 'Completed').length;
  return (
    <button onClick={onOpen} className="card-glass card-hover p-5 text-left space-y-3 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
          <h3 className="font-bold text-foreground truncate">{dept.department_name}</h3>
        </div>
        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full border flex-shrink-0 ${STATUS_BADGE[dept.status] || 'badge-gray'}`}>{dept.status || 'Discovery'}</span>
      </div>
      {dept.department_description && <p className="text-xs text-muted-foreground line-clamp-2">{dept.department_description}</p>}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        {dept.employee_count > 0 && <span>{dept.employee_count} employees</span>}
        <span>{deptUCs.length} use case{deptUCs.length !== 1 ? 's' : ''}</span>
        <span>{completedMeetings} meeting{completedMeetings !== 1 ? 's' : ''} done</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-cyan-400">
        View details <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}

const UC_BADGE = {
  'Discovery': 'badge-cyan',
  'Solution Design': 'badge-violet',
  'POC': 'badge-amber',
  'Delivered': 'badge-green',
  'On Hold': 'badge-gray',
};

export default function PortalDeptGrid({ data, onOpenDept, onOpenUseCase }) {
  const { departments, useCases, meetings } = data;
  // All sections start collapsed except the one with active use cases
  const [expanded, setExpanded] = useState({ 'Sales & Retail Channels': true });

  const sections = useMemo(() => {
    const map = new Map();
    departments.forEach(d => {
      const key = d.section_group || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    });
    return [...map.entries()];
  }, [departments]);

  const totalEmployees = departments.reduce((s, d) => s + (d.employee_count || 0), 0);
  const totalCompletedMeetings = meetings.filter(m => m.status === 'Completed').length;

  const stats = [
    { icon: Layers, label: 'Departments', value: departments.length },
    { icon: Users, label: 'Total Employees', value: totalEmployees.toLocaleString('en-IN') },
    { icon: ListChecks, label: 'Use Cases', value: useCases.length },
    { icon: CalendarCheck, label: 'Meetings Completed', value: totalCompletedMeetings },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Departments</h2>
        <p className="text-sm text-muted-foreground">Areas where Clara.ai is working with your team</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card-glass p-4 flex items-center gap-3">
            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active use cases — click to open the full detail */}
      {useCases.length > 0 && (
        <div className="card-glass p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Active Use Cases</h3>
          {useCases.map(uc => {
            const dept = departments.find(d => d.id === uc.department_id);
            return (
              <button key={uc.id} onClick={() => onOpenUseCase(uc)}
                className="w-full p-3 rounded-xl border border-border hover:border-cyan-500/30 text-left transition-all flex items-center justify-between gap-3 bg-white/60">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">{uc.process_name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{dept?.department_name}{uc.problem_statement ? ` · ${uc.problem_statement}` : ''}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${UC_BADGE[uc.status] || 'badge-gray'}`}>{uc.status || 'Discovery'}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Sections */}
      {sections.map(([section, depts]) => {
        const sectionPeople = depts.reduce((s, d) => s + (d.employee_count || 0), 0);
        const isCollapsed = !expanded[section];
        return (
          <div key={section} className="space-y-3">
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [section]: !prev[section] }))}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/30 hover:border-cyan-500/25 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                <span className="font-semibold text-sm text-foreground text-left truncate">{section}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                <span>{depts.length} dept{depts.length !== 1 ? 's' : ''}</span>
                {sectionPeople > 0 && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {sectionPeople.toLocaleString('en-IN')}</span>
                )}
              </div>
            </button>
            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {depts.map(d => (
                  <DeptCard key={d.id} dept={d} useCases={useCases} meetings={meetings} onOpen={() => onOpenDept(d)} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {departments.length === 0 && (
        <div className="card-glass p-10 text-center text-sm text-muted-foreground">
          No departments have been set up yet. Your Clara.ai team will populate this soon.
        </div>
      )}
    </div>
  );
}