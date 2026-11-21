import { useState } from 'react';
import Modal from '@/components/ui/Modal';

const COLORS = ['cyan', 'violet', 'amber', 'green', 'blue', 'red', 'purple', 'orange'];

function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AddTeamMemberModal({ open, onClose, onAdd, team }) {
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [form, setForm] = useState({
    name: '', role: '', department: '', emailPrefix: '', customEmail: '',
    phone: '', reportingManager: '', startDate: '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.role.trim()) e.role = 'Role is required';
    if (!useCustomEmail && !form.emailPrefix.trim()) e.email = 'Email prefix is required';
    if (useCustomEmail && !form.customEmail.trim()) e.email = 'Email is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const email = useCustomEmail ? form.customEmail : `${form.emailPrefix.trim().toLowerCase()}@claraai.tech`;
    const avatar = getInitials(form.name);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    onAdd({
      name: form.name.trim(),
      role: form.role.trim(),
      department: form.department.trim(),
      email,
      phone: form.phone.trim(),
      reportingManager: form.reportingManager,
      startDate: form.startDate,
      status: 'Available',
      avatar,
      color,
    });
    setForm({ name: '', role: '', department: '', emailPrefix: '', customEmail: '', phone: '', reportingManager: '', startDate: '' });
    setErrors({});
    setUseCustomEmail(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Team Member" size="md">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Enter full name"
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* Role */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Role / Designation *</label>
          <input value={form.role} onChange={e => set('role', e.target.value)}
            placeholder="e.g., Developer, Sales Manager, Designer"
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          {errors.role && <p className="text-xs text-destructive mt-1">{errors.role}</p>}
        </div>

        {/* Department */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
          <input value={form.department} onChange={e => set('department', e.target.value)}
            placeholder="e.g., Engineering, Sales, Operations"
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Email Address *</label>
          {!useCustomEmail ? (
            <div className="flex rounded-lg overflow-hidden border border-border focus-within:border-primary/50">
              <input
                value={form.emailPrefix}
                onChange={e => set('emailPrefix', e.target.value.replace(/[@\s]/g, ''))}
                placeholder="devanshi"
                className="flex-1 bg-input px-3 py-2 text-sm text-foreground focus:outline-none min-w-0"
              />
              <span className="bg-secondary/80 px-3 py-2 text-sm text-muted-foreground border-l border-border flex-shrink-0 select-none">
                @claraai.tech
              </span>
            </div>
          ) : (
            <input value={form.customEmail} onChange={e => set('customEmail', e.target.value)}
              placeholder="email@domain.com"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          )}
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          <button onClick={() => setUseCustomEmail(v => !v)}
            className="text-xs text-primary/60 hover:text-primary mt-1 underline transition-colors">
            {useCustomEmail ? 'Use @claraai.tech email' : 'Use custom email instead'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Phone Number</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+91-XXXXXXXXXX"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>

          {/* Start Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        {/* Reporting Manager */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Reporting Manager</label>
          <select value={form.reportingManager} onChange={e => set('reportingManager', e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
            <option value="">Select manager</option>
            {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-4 py-2 rounded-lg btn-primary-cyber text-sm font-semibold">
            Add Team Member
          </button>
        </div>
      </div>
    </Modal>
  );
}