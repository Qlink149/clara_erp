import { useState, useEffect, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';

export default function AuthorizationDrawer({ open, onClose, targetEmail, targetName, clients, engagements, existingAccess, onSaved }) {
  // Determine initial user type from existing access
  const initialUserType = existingAccess?.some(r => r.user_type === 'client') ? 'client' : 'employee';
  const initialLinkedClient = existingAccess?.find(r => r.linked_client_id)?.linked_client_id || '';
  const initialPortalLevel = existingAccess?.find(r => r.portal_access_level)?.portal_access_level || 'full';

  const [userType, setUserType] = useState(initialUserType);
  const [clientToggles, setClientToggles] = useState({});
  const [expandedClients, setExpandedClients] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // Client portal state
  const [linkedClientId, setLinkedClientId] = useState(initialLinkedClient);
  const [clientSearch, setClientSearch] = useState('');
  const [allEngagements, setAllEngagements] = useState(false);
  const [selectedEngIds, setSelectedEngIds] = useState(new Set());
  const [portalAccessLevel, setPortalAccessLevel] = useState(initialPortalLevel);

  useEffect(() => {
    if (!open) return;
    const isClient = existingAccess?.some(r => r.user_type === 'client');
    const detectedType = isClient ? 'client' : 'employee';
    setUserType(detectedType);

    if (isClient) {
      const lcId = existingAccess.find(r => r.linked_client_id)?.linked_client_id || '';
      const pal = existingAccess.find(r => r.portal_access_level)?.portal_access_level || 'full';
      setLinkedClientId(lcId);
      setPortalAccessLevel(pal);
      const hasAllEngs = existingAccess.some(r => r.linked_client_id && !r.engagement_id);
      setAllEngagements(hasAllEngs);
      const engIds = new Set(existingAccess.filter(r => r.engagement_id).map(r => r.engagement_id));
      setSelectedEngIds(engIds);
    } else {
      // Employee: build toggle state from existingAccess
      const state = {};
      for (const rec of (existingAccess || [])) {
        if (!state[rec.client_id]) {
          state[rec.client_id] = { on: true, allEngagements: false, engagementIds: new Set() };
        }
        if (!rec.engagement_id) {
          state[rec.client_id].allEngagements = true;
          state[rec.client_id].engagementIds = new Set();
        } else {
          state[rec.client_id].engagementIds.add(rec.engagement_id);
        }
      }
      setClientToggles(state);
      setLinkedClientId('');
    }
    setExpandedClients({});
    setDirty(false);
    setClientSearch('');
  }, [open, targetEmail, existingAccess]);

  const handleClose = () => {
    if (dirty) { setConfirmClose(true); return; }
    onClose();
  };

  // Employee toggle helpers
  const toggleClient = (clientId) => {
    setDirty(true);
    setClientToggles(prev => {
      const cur = prev[clientId] || { on: false, allEngagements: false, engagementIds: new Set() };
      const next = { ...cur, on: !cur.on };
      if (next.on) setExpandedClients(e => ({ ...e, [clientId]: true }));
      return { ...prev, [clientId]: next };
    });
  };

  const toggleAllEngagements = (clientId) => {
    setDirty(true);
    setClientToggles(prev => {
      const cur = prev[clientId] || { on: true, allEngagements: false, engagementIds: new Set() };
      return { ...prev, [clientId]: { ...cur, allEngagements: !cur.allEngagements, engagementIds: new Set() } };
    });
  };

  const toggleEngagement = (clientId, engId) => {
    setDirty(true);
    setClientToggles(prev => {
      const cur = prev[clientId] || { on: true, allEngagements: false, engagementIds: new Set() };
      const ids = new Set(cur.engagementIds);
      if (ids.has(engId)) ids.delete(engId); else ids.add(engId);
      return { ...prev, [clientId]: { ...cur, engagementIds: ids, allEngagements: false } };
    });
  };

  // Writes the access records directly (no backend function required)
  const writeAccess = async (records) => {
    await base44.entities.UserAccess.deleteMany({ email: targetEmail });
    if (records.length) await base44.entities.UserAccess.bulkCreate(records);
  };

  const handleSave = async () => {
    setSaving(true);
    const now = new Date().toISOString();

    if (userType === 'client') {
      const engIds = allEngagements ? [null] : Array.from(selectedEngIds);
      await writeAccess((engIds.length ? engIds : [null]).map(engId => ({
        email: targetEmail,
        client_id: linkedClientId,
        engagement_id: engId,
        granted_at: now,
        is_active: true,
        user_type: 'client',
        linked_client_id: linkedClientId,
        portal_access_level: portalAccessLevel || 'full',
      })));
    } else {
      const accessList = [];
      for (const [clientId, state] of Object.entries(clientToggles)) {
        if (!state.on) continue;
        const clientEngagements = engagements.filter(e => e.clientId === clientId);
        if (clientEngagements.length === 0) {
          accessList.push({ clientId, engagementId: null });
        } else if (state.allEngagements) {
          accessList.push({ clientId, engagementId: null });
        } else {
          for (const engId of state.engagementIds) {
            accessList.push({ clientId, engagementId: engId });
          }
        }
      }
      await writeAccess(accessList.map(a => ({
        email: targetEmail,
        client_id: a.clientId,
        engagement_id: a.engagementId || null,
        granted_at: now,
        is_active: true,
        user_type: 'employee',
      })));
    }

    setSaving(false);
    setDirty(false);
    onSaved && onSaved();
    onClose();
  };

  const handleRevokeAll = async () => {
    await base44.entities.UserAccess.deleteMany({ email: targetEmail });
    setConfirmRevoke(false);
    onSaved && onSaved();
    onClose();
  };

  const hasActiveAccess = userType === 'client'
    ? !!linkedClientId
    : Object.values(clientToggles).some(s => s.on);

  const clientGroups = [
    { label: 'Current Clients', type: 'current', defaultOpen: true },
    { label: 'Upcoming Clients', type: 'upcoming', defaultOpen: false },
    { label: 'Past Clients', type: 'past', defaultOpen: false },
  ];

  const allClientsList = [...clients].sort((a, b) => a.name.localeCompare(b.name));
  const filteredClientsList = clientSearch
    ? allClientsList.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : allClientsList;

  const linkedClient = clients.find(c => c.id === linkedClientId);
  const linkedClientEngagements = linkedClientId
    ? engagements.filter(e => e.clientId === linkedClientId && !e.archived)
    : [];

  // Validation
  const clientValidationError = userType === 'client' && linkedClientId && !allEngagements && selectedEngIds.size === 0 && linkedClientEngagements.length > 0
    ? 'Select at least one engagement.'
    : null;

  const canSave = userType === 'client'
    ? !!linkedClientId && !clientValidationError
    : !Object.entries(clientToggles).some(([clientId, state]) => {
        if (!state.on) return false;
        const engs = engagements.filter(e => e.clientId === clientId && !e.archived);
        return engs.length > 0 && !state.allEngagements && state.engagementIds.size === 0;
      });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={handleClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col animate-slide-in"
        style={{
          background: 'linear-gradient(180deg, rgba(5,10,20,0.99) 0%, rgba(3,7,14,0.99) 100%)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRight: 'none',
          boxShadow: '-4px 0 40px rgba(0,0,0,0.6)',
        }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Manage Access</h2>
            <p className="text-base font-semibold text-primary mt-1 truncate">{targetEmail}</p>
            {targetName && targetName !== targetEmail && (
              <p className="text-xs text-muted-foreground mt-0.5">{targetName}</p>
            )}
            <div className="mt-2">
              {hasActiveAccess
                ? <span className="px-2 py-0.5 rounded text-xs font-bold badge-green">Authorized</span>
                : <span className="px-2 py-0.5 rounded text-xs font-bold badge-amber">Pending — No Access</span>
              }
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button onClick={() => setConfirmRevoke(true)}
              className="text-xs font-semibold text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
              Revoke All
            </button>
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Type Toggle */}
        <div className="px-6 pt-5 pb-4 border-b border-white/5 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">User Type</p>
          <div className="flex rounded-xl overflow-hidden border border-border">
            <button
              onClick={() => { setUserType('employee'); setDirty(true); }}
              className={cn('flex-1 py-2.5 text-sm font-semibold transition-all',
                userType === 'employee'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              )}>
              Internal Employee
            </button>
            <button
              onClick={() => { setUserType('client'); setDirty(true); }}
              className={cn('flex-1 py-2.5 text-sm font-semibold transition-all border-l border-border',
                userType === 'client'
                  ? 'bg-amber-500 text-[#050a14]'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              )}>
              Client Portal
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {userType === 'employee' ? (
            /* ── EMPLOYEE FLOW ── */
            clientGroups.map(group => {
              const groupClients = clients.filter(c => c.client_type === group.type);
              if (groupClients.length === 0) return null;
              return (
                <div key={group.type}>
                  <button
                    onClick={() => setExpandedClients(e => ({ ...e, [`_group_${group.type}`]: !e[`_group_${group.type}`] }))}
                    className="flex items-center gap-2 w-full text-left mb-3 group">
                    {expandedClients[`_group_${group.type}`] !== false && group.defaultOpen || expandedClients[`_group_${group.type}`]
                      ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>{group.label}</span>
                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>({groupClients.length})</span>
                  </button>

                  {(expandedClients[`_group_${group.type}`] !== false && group.defaultOpen || expandedClients[`_group_${group.type}`]) && (
                    <div className="space-y-2">
                      {groupClients.map(client => {
                        const state = clientToggles[client.id] || { on: false, allEngagements: false, engagementIds: new Set() };
                        const clientEngs = engagements.filter(e => e.clientId === client.id && !e.archived);
                        const hasEngs = clientEngs.length > 0;
                        const selectedEngCount = state.allEngagements ? clientEngs.length : state.engagementIds.size;
                        const noEngSelected = state.on && hasEngs && !state.allEngagements && state.engagementIds.size === 0;

                        return (
                          <div key={client.id} className="rounded-xl border overflow-hidden"
                            style={{ borderColor: state.on ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)', background: state.on ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.02)' }}>
                            <div className="flex items-center justify-between px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => state.on && setExpandedClients(e => ({ ...e, [client.id]: !e[client.id] }))} className="text-left">
                                  {state.on && hasEngs && (expandedClients[client.id]
                                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />)}
                                </button>
                                <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{client.name}</span>
                                {state.on && hasEngs && (
                                  <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                    {state.allEngagements ? `all ${clientEngs.length}` : `${selectedEngCount}/${clientEngs.length}`} engagements
                                  </span>
                                )}
                              </div>
                              <button onClick={() => toggleClient(client.id)}
                                className={cn('w-10 h-5 rounded-full transition-all flex-shrink-0 relative', state.on ? 'bg-primary' : 'bg-white/10')}>
                                <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow', state.on ? 'left-5' : 'left-0.5')} />
                              </button>
                            </div>
                            {state.on && expandedClients[client.id] && (
                              <div className="px-4 pb-3 border-t border-white/5 pt-3 space-y-2">
                                {!hasEngs ? (
                                  <p className="text-xs italic" style={{ color: '#94a3b8' }}>No engagements yet — user will see client overview, tasks, pending items, and documents only.</p>
                                ) : (
                                  <>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <input type="checkbox" checked={state.allEngagements} onChange={() => toggleAllEngagements(client.id)} className="w-3.5 h-3.5 accent-cyan-400" />
                                      <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>All Engagements</span>
                                      <span className="text-[10px]" style={{ color: '#94a3b8' }}>(incl. future)</span>
                                    </label>
                                    {!state.allEngagements && clientEngs.map(eng => (
                                      <label key={eng.id} className="flex items-center gap-2 cursor-pointer ml-2">
                                        <input type="checkbox" checked={state.engagementIds.has(eng.id)} onChange={() => toggleEngagement(client.id, eng.id)} className="w-3.5 h-3.5 accent-cyan-400" />
                                        <span className="text-xs" style={{ color: '#cbd5e1' }}>{eng.name}</span>
                                      </label>
                                    ))}
                                    {noEngSelected && (
                                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Select at least one engagement, or turn off client access.
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* ── CLIENT PORTAL FLOW ── */
            <div className="space-y-6">
              {/* Step 1: Link to client */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                  1 · This email belongs to which client company?
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                    placeholder="Search clients..."
                    className="w-full bg-input border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/40" />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-border bg-secondary/20 p-1">
                  {filteredClientsList.map(c => (
                    <button key={c.id}
                      onClick={() => { setLinkedClientId(c.id); setDirty(true); setSelectedEngIds(new Set()); setAllEngagements(false); }}
                      className={cn('w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between',
                        linkedClientId === c.id ? 'bg-amber-500/15 text-amber-300' : 'text-foreground hover:bg-secondary/50'
                      )}>
                      <span>{c.name}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{c.client_type}</span>
                    </button>
                  ))}
                  {filteredClientsList.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No clients found</p>}
                </div>
              </div>

              {/* Step 2: Engagements */}
              {linkedClientId && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">
                    2 · Which projects can this person track?
                  </label>
                  {linkedClientEngagements.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-3 rounded-xl border border-border bg-secondary/20">
                      No engagements created yet. Create engagements in the client's internal profile first.
                    </p>
                  ) : (
                    <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3">
                      <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-border">
                        <input type="checkbox" checked={allEngagements} onChange={() => { setAllEngagements(o => !o); setDirty(true); setSelectedEngIds(new Set()); }} className="w-3.5 h-3.5 accent-amber-400" />
                        <span className="text-xs font-semibold text-foreground">All Projects</span>
                        <span className="text-[10px] text-muted-foreground">(incl. future)</span>
                      </label>
                      {!allEngagements && linkedClientEngagements.map(eng => (
                        <label key={eng.id} className="flex items-center gap-2 cursor-pointer ml-2">
                          <input type="checkbox"
                            checked={selectedEngIds.has(eng.id)}
                            onChange={() => {
                              setDirty(true);
                              setSelectedEngIds(prev => {
                                const s = new Set(prev);
                                if (s.has(eng.id)) s.delete(eng.id); else s.add(eng.id);
                                return s;
                              });
                            }}
                            className="w-3.5 h-3.5 accent-amber-400" />
                          <span className="text-xs text-foreground/80">{eng.name}</span>
                        </label>
                      ))}
                      {clientValidationError && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> {clientValidationError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Access Level */}
              {linkedClientId && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">
                    3 · How much detail can they see?
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'full', label: 'Full Transparency', desc: 'All task details, assignees, timelines, deadlines, pending items, and payment schedule.' },
                      { value: 'summary', label: 'Summary Only', desc: 'Overall progress %, milestone-level status, and pending items. No task names, assignees, or payment details.' },
                    ].map(opt => (
                      <label key={opt.value}
                        className={cn('flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all',
                          portalAccessLevel === opt.value ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-secondary/20 hover:bg-secondary/40'
                        )}>
                        <input type="radio" checked={portalAccessLevel === opt.value} onChange={() => { setPortalAccessLevel(opt.value); setDirty(true); }} className="mt-0.5 accent-amber-400" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Save */}
        <div className="flex-shrink-0 p-6 border-t border-white/5">
          <button onClick={handleSave} disabled={saving || !canSave}
            className={cn(
              'w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed',
              userType === 'client' ? 'bg-amber-500 text-[#050a14] hover:bg-amber-400' : 'btn-primary-cyber'
            )}>
            {saving ? 'Saving...' : userType === 'client' ? 'Grant Client Portal Access' : 'Save Access Settings'}
          </button>
        </div>
      </div>

      {/* Confirm close */}
      {confirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-semibold text-foreground mb-2">Unsaved Changes</h3>
            <p className="text-sm text-muted-foreground mb-4">You have unsaved changes. Discard them?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClose(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">Keep Editing</button>
              <button onClick={() => { setConfirmClose(false); setDirty(false); onClose(); }}
                className="flex-1 py-2 rounded-xl bg-destructive/20 border border-destructive/30 text-destructive text-sm font-medium">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm revoke all */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-semibold text-foreground mb-2">Revoke All Access?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will remove ALL access for <strong className="text-foreground">{targetName || targetEmail}</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRevoke(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
              <button onClick={handleRevokeAll} className="flex-1 py-2 rounded-xl bg-destructive/20 border border-destructive/30 text-destructive text-sm font-medium">Revoke All</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}