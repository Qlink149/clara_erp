import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, ChevronRight, ChevronDown, Users, Layers, ListChecks, CalendarCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminUseCaseEditor from '@/components/clientportal/AdminUseCaseEditor';
import AdminDeptDetail from '@/components/clientportal/AdminDeptDetail';

const STATUS_BADGE = {
  'Discovery': 'badge-cyan',
  'In Progress': 'badge-amber',
  'Delivered': 'badge-green',
  'On Hold': 'badge-gray',
};

const DEFAULT_EXPANDED = 'Sales & Retail Channels';

export default function AdminClientManager({ portalClient, onBack }) {
  const [departments, setDepartments] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedUC, setSelectedUC] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({ [DEFAULT_EXPANDED]: true });

  const load = async () => {
    const depts = await base44.entities.PortalDepartment.filter({ portal_client_id: portalClient.id });
    setDepartments(depts);
    const ucs = [];
    for (const d of depts) {
      ucs.push(...await base44.entities.PortalUseCase.filter({ department_id: d.id }));
    }
    setUseCases(ucs);
    const ucIds = new Set(ucs.map(u => u.id));
    const allMeetings = await base44.entities.PortalMeeting.list(null, 500);
    setMeetings(allMeetings.filter(m => ucIds.has(m.use_case_id)));
    setLoading(false);
  };
  useEffect(() => { load(); }, [portalClient.id]);

  const addDept = async () => {
    if (!newDeptName) return;
    await base44.entities.PortalDepartment.create({ portal_client_id: portalClient.id, department_name: newDeptName, status: 'Discovery' });
    setNewDeptName('');
    load();
  };

  const updateDept = async (id, data) => {
    await base44.entities.PortalDepartment.update(id, data);
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    if (selectedDept?.id === id) setSelectedDept(prev => ({ ...prev, ...data }));
  };

  const deleteDept = async (id) => {
    if (!confirm('Delete this department and its use cases?')) return;
    await base44.entities.PortalDepartment.delete(id);
    if (selectedDept?.id === id) setSelectedDept(null);
    load();
  };

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
  const completedMeetings = meetings.filter(m => m.status === 'Completed').length;

  const inputCls = "bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50";

  if (selectedUC) {
    return (
      <AdminUseCaseEditor
        useCase={selectedUC}
        department={departments.find(d => d.id === selectedUC.department_id)}
        portalClient={portalClient}
        onBack={() => { setSelectedUC(null); load(); }}
        onDeleted={() => { setSelectedUC(null); load(); }}
      />
    );
  }

  if (selectedDept) {
    return (
      <AdminDeptDetail
        dept={selectedDept}
        useCases={useCases}
        meetings={meetings}
        onBack={() => { setSelectedDept(null); load(); }}
        onOpenUseCase={setSelectedUC}
        onUpdate={updateDept}
        onDelete={deleteDept}
        onReload={load}
      />
    );
  }

  const stats = [
    { icon: Layers, label: 'Departments', value: departments.length },
    { icon: Users, label: 'Employees', value: totalEmployees.toLocaleString('en-IN') },
    { icon: ListChecks, label: 'Active Use Cases', value: useCases.length },
    { icon: CalendarCheck, label: 'Meetings Completed', value: completedMeetings },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h2 className="text-lg font-bold text-foreground">{portalClient.client_name}</h2>
          <p className="text-xs text-muted-foreground">{portalClient.login_email} · /portal/{portalClient.portal_slug}</p>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : (
        <>
          {/* Summary strip */}
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

          {/* Collapsible sections */}
          {sections.map(([section, depts]) => {
            const sectionPeople = depts.reduce((s, d) => s + (d.employee_count || 0), 0);
            const isExpanded = !!expanded[section];
            return (
              <div key={section} className="space-y-2">
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [section]: !prev[section] }))}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-white/70 hover:border-cyan-500/25 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                    <span className="font-semibold text-sm text-foreground text-left truncate">{section}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                    {sectionPeople > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {sectionPeople.toLocaleString('en-IN')} people</span>}
                    <span>{depts.length} department{depts.length !== 1 ? 's' : ''}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="space-y-2 pl-4">
                    {depts.map(d => {
                      const ucCount = useCases.filter(u => u.department_id === d.id).length;
                      return (
                        <button key={d.id} onClick={() => setSelectedDept(d)}
                          className="w-full p-3 rounded-xl border border-border bg-white/80 hover:border-cyan-500/30 text-left transition-all flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">{d.department_name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {[d.employee_count > 0 ? `${d.employee_count} employees` : null, d.head, `${ucCount} use case${ucCount !== 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGE[d.status] || 'badge-gray'}`}>{d.status || 'Discovery'}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {departments.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No departments yet</p>}

          {/* Add department */}
          <div className="flex items-center gap-2 max-w-lg">
            <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDept()} className={`${inputCls} flex-1`} placeholder="New department name..." />
            <button onClick={addDept} className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>
        </>
      )}
    </div>
  );
}