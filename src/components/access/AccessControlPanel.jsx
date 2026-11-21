import { useState, useEffect, useMemo } from 'react';
import { Shield, Search, ChevronUp, ChevronDown, Users, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useStore } from '@/lib/StoreContext';
import AuthorizationDrawer from './AuthorizationDrawer';
import { format } from 'date-fns';

const TEAM_EMAILS = {
  'Laksh': null,
  'Sidhi': null,
  'Sidharth': null,
  'Pratham': null,
};

export default function AccessControlPanel() {
  const { clients, engagements, team } = useStore();
  const [registry, setRegistry] = useState([]);
  const [allAccess, setAllAccess] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('last_login_at');
  const [sortDir, setSortDir] = useState('desc');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [rows, access] = await Promise.all([
      base44.entities.LoginRegistry.list('-last_login_at', 200),
      base44.entities.UserAccess.list('-created_date', 500),
    ]);
    setRegistry(rows || []);
    setAllAccess(access || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getAccessForEmail = (email) => allAccess.filter(a => a.email === email && a.is_active);
  const getPendingForEmail = (email) => allAccess.filter(a => a.email === email && !a.is_active);

  const pendingRequests = useMemo(() => {
    // Users with only inactive/pending records (no active ones)
    const emailsWithActive = new Set(allAccess.filter(a => a.is_active).map(a => a.email));
    const pendingGroups = {};
    for (const rec of allAccess) {
      if (!rec.is_active && !emailsWithActive.has(rec.email)) {
        if (!pendingGroups[rec.email]) pendingGroups[rec.email] = [];
        pendingGroups[rec.email].push(rec);
      }
    }
    return Object.entries(pendingGroups).map(([email, recs]) => ({
      email,
      display_name: registry.find(r => r.email === email)?.display_name || email,
      userType: recs[0]?.user_type,
      linkedClientId: recs[0]?.linked_client_id,
      records: recs,
    }));
  }, [allAccess, registry]);

  const [approvingEmail, setApprovingEmail] = useState(null);
  const handleApprove = async (email) => {
    setApprovingEmail(email);
    await base44.entities.UserAccess.updateMany({ email, is_active: false }, { $set: { is_active: true } });
    await load();
    setApprovingEmail(null);
  };

  const getUserType = (email) => {
    const records = getAccessForEmail(email);
    if (records.length === 0) return 'unassigned';
    if (records.some(r => r.user_type === 'client')) return 'client';
    return 'employee';
  };

  const accessSummary = (email) => {
    const records = getAccessForEmail(email);
    if (records.length === 0) return 'No access';
    const userType = getUserType(email);
    if (userType === 'client') {
      const linkedClientId = records.find(r => r.linked_client_id)?.linked_client_id;
      const clientName = clients.find(c => c.id === linkedClientId)?.name || 'Unknown';
      return `Client portal · ${clientName}`;
    }
    const clientIds = new Set(records.map(r => r.client_id));
    const engCount = records.filter(r => r.engagement_id).length;
    return `${clientIds.size} client${clientIds.size > 1 ? 's' : ''}${engCount > 0 ? `, ${engCount} engagement${engCount > 1 ? 's' : ''}` : ''}`;
  };

  const TypeBadge = ({ email }) => {
    const t = getUserType(email);
    if (t === 'client') return <span className="px-2 py-0.5 rounded badge-amber text-[10px] font-bold">Client</span>;
    if (t === 'employee') return <span className="px-2 py-0.5 rounded badge-cyan text-[10px] font-bold">Employee</span>;
    return <span className="px-2 py-0.5 rounded badge-gray text-[10px] font-bold">Unassigned</span>;
  };

  const sorted = useMemo(() => {
    let rows = [...registry].filter(r =>
      !search || r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.display_name || '').toLowerCase().includes(search.toLowerCase())
    );
    rows.sort((a, b) => {
      let av = a[sortBy] || '', bv = b[sortBy] || '';
      if (sortDir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });
    return rows;
  }, [registry, search, sortBy, sortDir]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const openDrawer = (email, name) => {
    setDrawerTarget({ email, name });
    setDrawerOpen(true);
  };

  const SortIcon = ({ col }) => sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />)
    : null;

  const teamCards = team.filter(m => m.name !== 'Yogansh' && m.name !== 'Yogansh Bhantia');

  const formatDate = (str) => {
    if (!str) return '—';
    try { return format(new Date(str), 'MMM d, yyyy HH:mm'); } catch { return str; }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Access Control</h2>
          <p className="text-xs text-muted-foreground">Manage who can see what in the ERP</p>
        </div>
      </div>

      {/* Quick Team Access */}
      {teamCards.length > 0 && (
        <div className="card-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Team Quick Access</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {teamCards.map(member => {
              const summary = accessSummary(member.email || '');
              const accessRecs = member.email ? getAccessForEmail(member.email) : [];
              return (
                <div key={member.id} className="rounded-xl p-4 border border-border bg-secondary/30 flex flex-col gap-2">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold', `bg-${member.color}-500/20 text-${member.color}-300`)}>
                    {member.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground">{member.role}</p>
                  </div>
                  <p className="text-[10px] text-primary/70">{member.email ? accessSummary(member.email) : 'No email on record'}</p>
                  {member.email && (
                    <button onClick={() => openDrawer(member.email, member.name)}
                      className="mt-1 w-full py-1.5 rounded-lg text-xs font-semibold btn-cyber">
                      Edit Access
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Approval Requests */}
      {pendingRequests.length > 0 && (
        <div className="card-glass p-5" style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.03)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Pending Approval ({pendingRequests.length})</span>
          </div>
          <div className="space-y-3">
            {pendingRequests.map(req => {
              const clientName = req.linkedClientId ? clients.find(c => c.id === req.linkedClientId)?.name : null;
              return (
                <div key={req.email} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/15 bg-amber-500/5 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-amber-500/20 text-amber-400">
                      {(req.display_name || req.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{req.display_name || req.email}</p>
                      <p className="text-xs text-muted-foreground">{req.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {req.userType === 'client' ? (
                          <span className="px-1.5 py-0.5 rounded badge-amber text-[9px] font-bold">Client{clientName ? ` · ${clientName}` : ''}</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded badge-cyan text-[9px] font-bold">Employee</span>
                        )}
                        <span className="text-[10px] text-amber-400/60">Awaiting access</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDrawer(req.email, req.display_name)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-semibold btn-cyber">
                      Configure
                    </button>
                    <button
                      onClick={() => handleApprove(req.email)}
                      disabled={approvingEmail === req.email}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <CheckCircle className="w-3 h-3" />
                      {approvingEmail === req.email ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Login Registry */}
      <div className="card-glass p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Login Registry</span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="bg-input border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 w-56" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No logins recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground">
                  {[
                  { key: 'email', label: 'Email' },
                  { key: 'display_name', label: 'Name' },
                  { key: 'first_login_at', label: 'First Login' },
                  { key: 'last_login_at', label: 'Last Login' },
                  { key: '_status', label: 'Status' },
                  { key: '_type', label: 'Type' },
                  { key: '_scope', label: 'Scope' },
                  { key: '_action', label: '' },
                  ].map(col => (
                    <th key={col.key}
                      onClick={() => !col.key.startsWith('_') && handleSort(col.key)}
                      className={cn('text-left py-2 px-3 font-semibold tracking-widest uppercase text-[10px]',
                        !col.key.startsWith('_') && 'cursor-pointer hover:text-foreground')}>
                      {col.label}<SortIcon col={col.key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(row => {
                  const accessRecs = getAccessForEmail(row.email);
                  const isAuthorized = accessRecs.length > 0;
                  return (
                    <tr key={row.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                     <td className="py-2.5 px-3 text-foreground font-medium">
                       <span className="flex items-center gap-2">
                         {row.email}
                         {row.email?.endsWith('@claraai.tech') && (
                           <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 uppercase tracking-wider">Internal</span>
                         )}
                       </span>
                     </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{row.display_name || '—'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{formatDate(row.first_login_at)}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{formatDate(row.last_login_at)}</td>
                      <td className="py-2.5 px-3">
                         {isAuthorized
                           ? <span className="px-2 py-0.5 rounded badge-green text-[10px] font-bold">Authorized</span>
                           : getPendingForEmail(row.email).length > 0
                             ? <span className="px-2 py-0.5 rounded badge-amber text-[10px] font-bold">⏳ Pending Approval</span>
                             : <span className="px-2 py-0.5 rounded badge-gray text-[10px] font-bold">No Access</span>
                         }
                       </td>
                       <td className="py-2.5 px-3"><TypeBadge email={row.email} /></td>
                       <td className="py-2.5 px-3 text-muted-foreground">{accessSummary(row.email)}</td>
                      <td className="py-2.5 px-3">
                        <button onClick={() => openDrawer(row.email, row.display_name)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold btn-cyber">
                          Manage Access
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerTarget && (
        <AuthorizationDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          targetEmail={drawerTarget.email}
          targetName={drawerTarget.name}
          clients={clients}
          engagements={engagements}
          existingAccess={getAccessForEmail(drawerTarget.email)}
          onSaved={load}
        />
      )}
    </div>
  );
}