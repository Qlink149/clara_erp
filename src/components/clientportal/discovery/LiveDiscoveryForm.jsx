import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Wifi, WifiOff, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { base44 } from '@/api/base44Client';
import useAutoSave from './useAutoSave';
import ProcessDiagramPanel from './ProcessDiagramPanel';
import SectionA from './SectionA';
import SectionB from './SectionB';
import SectionC from './SectionC';
import SectionD from './SectionD';
import SectionE from './SectionE';
import SectionF from './SectionF';

const ANCHORS = [['A', 'sec-a'], ['B', 'sec-b'], ['C', 'sec-c'], ['D', 'sec-d'], ['E', 'sec-e'], ['F', 'sec-f']];

export default function LiveDiscoveryForm({ useCase, department, portalClient, onClose }) {
  const [form, setForm] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [steps, setSteps] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const diagramRef = useRef(null);
  const { queue, flush, status, lastSaved, markSaved } = useAutoSave();

  useEffect(() => {
    (async () => {
      const [forms, meetings] = await Promise.all([
        base44.entities.PortalDiscoveryForm.filter({ use_case_id: useCase.id }),
        base44.entities.PortalMeeting.filter({ use_case_id: useCase.id, meeting_type: 'Discovery' }),
      ]);
      setForm(forms[0] || await base44.entities.PortalDiscoveryForm.create({ use_case_id: useCase.id }));
      setMeeting(meetings[0] || await base44.entities.PortalMeeting.create({
        use_case_id: useCase.id, meeting_title: `Discovery Call — ${useCase.process_name}`,
        meeting_type: 'Discovery', status: 'Scheduled', meeting_date: format(new Date(), 'yyyy-MM-dd'),
      }));
    })();
  }, [useCase.id]);

  const change = (k, v) => { setForm(p => ({ ...p, [k]: v })); queue('PortalDiscoveryForm', form.id, k, v); };
  const changeMeeting = (k, v) => { setMeeting(p => ({ ...p, [k]: v })); queue('PortalMeeting', meeting.id, k, v); };
  const changeUseCase = (k, v) => queue('PortalUseCase', useCase.id, k, v);
  const changeDept = (k, v) => { if (department?.id) queue('PortalDepartment', department.id, k, v); };

  const exportPng = async () => {
    if (!diagramRef.current) return;
    const canvas = await html2canvas(diagramRef.current, { backgroundColor: '#ffffff', scale: 2 });
    const a = document.createElement('a');
    a.download = `${(useCase.process_name || 'process').replace(/[^a-zA-Z0-9]+/g, '_')}_diagram.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const close = async () => { await flush(); onClose(); };

  if (!form || !meeting) {
    return createPortal(
      <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center text-muted-foreground text-sm">
        Loading discovery form...
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-background overflow-y-auto" style={{ background: '#eeeafc' }}>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-foreground truncate">{useCase.process_name}</h1>
            <p className="text-[10px] text-muted-foreground">{portalClient?.client_name} · {department?.department_name} · {meeting.meeting_date || 'Date TBC'}</p>
          </div>
          <div className="flex items-center gap-1">
            {ANCHORS.map(([label, id]) => (
              <button key={id} onClick={() => jump(id)} className="w-7 h-7 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-cyan-400 hover:border-cyan-500/40">{label}</button>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${status === 'offline' ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : status === 'saving' ? 'border-cyan-500/30 text-cyan-400' : 'border-emerald-500/30 text-emerald-400'}`}>
            {status === 'offline' ? <><WifiOff className="w-3 h-3" /> Offline — will sync when back online</>
              : status === 'saving' ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
              : <><Check className="w-3 h-3" /> Saved{lastSaved ? ` · ${format(lastSaved, 'HH:mm:ss')}` : ''}</>}
          </div>
          <button onClick={exportPng} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
            <Download className="w-3.5 h-3.5" /> Export PNG
          </button>
          <button onClick={close} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Form (left) + live diagram (right); reflows to single column when narrow */}
      <div className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
        <div className="xl:col-span-3 space-y-4 pb-16">
          <SectionA useCase={useCase} department={department} portalClient={portalClient} meeting={meeting}
            changeMeeting={changeMeeting} changeUseCase={changeUseCase} changeDept={changeDept} flush={flush} />
          <SectionB form={form} change={change} flush={flush} />
          <SectionC form={form} change={change} flush={flush} markSaved={markSaved} />
          <SectionD form={form} change={change} flush={flush} onStepsChange={setSteps} onExceptionsChange={setExceptions} markSaved={markSaved} />
          <SectionE form={form} change={change} flush={flush} />
          <SectionF form={form} change={change} flush={flush} />
          <p className="text-xs text-muted-foreground">After the call: fill the Post-Discovery section (problem/solution statements, ECRS, automation type, suitability score, demo prompt) on the use case detail page.</p>
        </div>
        <div className="xl:col-span-2 xl:sticky xl:top-16">
          <ProcessDiagramPanel ref={diagramRef} steps={steps} exceptions={exceptions} processName={useCase.process_name} />
        </div>
      </div>
    </div>,
    document.body
  );
}