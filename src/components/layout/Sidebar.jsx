import { useState } from 'react';
import { Home, Building2, Users, CheckSquare, ChevronLeft, ChevronRight, X, Cpu, LogOut, Shield, FileText, Receipt, BarChart2, FolderOpen, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/StoreContext';
import { base44 } from '@/api/base44Client';
import { useAuthorization } from '@/lib/AuthorizationContext';
import { useInvoiceAccess, useProformaAccess, useKpiAdminAccess, useKpiViewOwnAccess, useClientPortalAdminAccess } from '@/lib/moduleAccess';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'clients', label: 'Clients', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'tasks', label: 'Task Center', icon: CheckSquare },
];

export default function Sidebar({ activePage, onNavigate, mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const authz = useAuthorization();
  const isSuperAdmin = authz?.role === 'SUPER_ADMIN';
  const canSeeInvoice = useInvoiceAccess();
  const canSeeProforma = useProformaAccess();
  const isKpiAdmin = useKpiAdminAccess();
  const canSeeOwnKpi = useKpiViewOwnAccess();
  const canSeeClientPortal = useClientPortalAdminAccess();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col border-r transition-all duration-300',
          'border-cyan-500/10',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderRight: '1px solid rgba(12,8,40,0.09)',
          boxShadow: '1px 0 2px rgba(12,8,40,0.04), 3px 0 16px rgba(12,8,40,0.04)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(93,39,202,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(93,39,202,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Brand accent line on left edge */}
        <div className="absolute left-0 top-8 bottom-8 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(93,39,202,0.4), transparent)' }}
        />

        {/* Logo */}
        <div className={cn('relative flex items-center h-16 px-4 border-b border-cyan-500/10', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center animate-glow-pulse"
                style={{ background: 'linear-gradient(135deg, #8d57de, #1f0798)', boxShadow: '0 8px 20px rgba(93,39,202,0.3)' }}>
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-foreground text-sm tracking-widest uppercase">CLARA</span>
                <span className="text-cyan-400 text-[9px] tracking-widest ml-0.5">.AI</span>
                <div className="text-[9px] text-cyan-500/50 tracking-widest uppercase -mt-0.5">ERP COMMAND</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center animate-glow-pulse"
              style={{ background: 'linear-gradient(135deg, #8d57de, #1f0798)', boxShadow: '0 8px 20px rgba(93,39,202,0.3)' }}>
              <Cpu className="w-4 h-4 text-white" />
            </div>
          )}
          <button onClick={onMobileClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <span className="text-[9px] tracking-widest uppercase text-cyan-500/40 font-semibold">Navigation</span>
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onMobileClose?.(); }}
                className={cn(
                  'nav-item w-full group',
                  isActive && 'nav-item-active',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon className={cn('w-[18px] h-[18px] transition-colors', isActive ? 'text-cyan-300' : 'group-hover:text-cyan-400/70')} />
                </div>
                {!collapsed && <span className="flex-1 text-left tracking-wide">{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="w-1 h-1 rounded-full bg-cyan-400 ml-1" />
                )}
              </button>
            );
          })}

          {/* Invoice Calendar — gated */}
          {canSeeInvoice && (
            <button
              onClick={() => { onNavigate('invoice-calendar'); onMobileClose?.(); }}
              className={cn('nav-item w-full group', activePage === 'invoice-calendar' && 'nav-item-active', collapsed && 'justify-center px-2')}
              title={collapsed ? 'Invoice Calendar' : undefined}
            >
              <FileText className={cn('w-[18px] h-[18px] transition-colors', activePage === 'invoice-calendar' ? 'text-cyan-300' : 'group-hover:text-cyan-400/70')} />
              {!collapsed && <span className="flex-1 text-left tracking-wide">Invoice Calendar</span>}
              {activePage === 'invoice-calendar' && !collapsed && <div className="w-1 h-1 rounded-full bg-cyan-400 ml-1" />}
            </button>
          )}

          {/* Proforma Invoices — gated same as Invoice Calendar */}
          {canSeeProforma && (
            <button
              onClick={() => { onNavigate('proforma-invoices'); onMobileClose?.(); }}
              className={cn('nav-item w-full group', activePage === 'proforma-invoices' && 'nav-item-active', collapsed && 'justify-center px-2')}
              title={collapsed ? 'Proforma Invoices' : undefined}
            >
              <Receipt className={cn('w-[18px] h-[18px] transition-colors', activePage === 'proforma-invoices' ? 'text-cyan-300' : 'group-hover:text-cyan-400/70')} />
              {!collapsed && <span className="flex-1 text-left tracking-wide">Proforma Invoices</span>}
              {activePage === 'proforma-invoices' && !collapsed && <div className="w-1 h-1 rounded-full bg-cyan-400 ml-1" />}
            </button>
          )}

          {/* Documentation — visible to all team members */}
          <button
            onClick={() => { onNavigate('documentation'); onMobileClose?.(); }}
            className={cn('nav-item w-full group', activePage === 'documentation' && 'nav-item-active', collapsed && 'justify-center px-2')}
            title={collapsed ? 'Documentation' : undefined}
          >
            <FolderOpen className={cn('w-[18px] h-[18px] transition-colors', activePage === 'documentation' ? 'text-cyan-300' : 'group-hover:text-cyan-400/70')} />
            {!collapsed && <span className="flex-1 text-left tracking-wide">Documentation</span>}
            {activePage === 'documentation' && !collapsed && <div className="w-1 h-1 rounded-full bg-cyan-400 ml-1" />}
          </button>

          {/* Client Portal — gated */}
          {canSeeClientPortal && (
            <button
              onClick={() => { onNavigate('client-portal'); onMobileClose?.(); }}
              className={cn('nav-item w-full group', activePage === 'client-portal' && 'nav-item-active', collapsed && 'justify-center px-2')}
              title={collapsed ? 'Client Portal' : undefined}
            >
              <Globe className={cn('w-[18px] h-[18px] transition-colors', activePage === 'client-portal' ? 'text-cyan-300' : 'group-hover:text-cyan-400/70')} />
              {!collapsed && <span className="flex-1 text-left tracking-wide">Client Portal</span>}
              {activePage === 'client-portal' && !collapsed && <div className="w-1 h-1 rounded-full bg-cyan-400 ml-1" />}
            </button>
          )}

          {/* KPI Tracker — admin full, others view own if granted */}
          {(isKpiAdmin || canSeeOwnKpi) && (
            <button
              onClick={() => { onNavigate('kpi-tracker'); onMobileClose?.(); }}
              className={cn('nav-item w-full group', activePage === 'kpi-tracker' && 'nav-item-active', collapsed && 'justify-center px-2')}
              title={collapsed ? 'KPI Tracker' : undefined}
            >
              <BarChart2 className={cn('w-[18px] h-[18px] transition-colors', activePage === 'kpi-tracker' ? 'text-cyan-300' : 'group-hover:text-cyan-400/70')} />
              {!collapsed && <span className="flex-1 text-left tracking-wide">KPI Tracker</span>}
              {activePage === 'kpi-tracker' && !collapsed && <div className="w-1 h-1 rounded-full bg-cyan-400 ml-1" />}
            </button>
          )}

          {/* Access Control — super admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => { onNavigate('access-control'); onMobileClose?.(); }}
              className={cn(
                'nav-item w-full group',
                activePage === 'access-control' && 'nav-item-active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? 'Access Control' : undefined}
            >
              <Shield className={cn('w-[18px] h-[18px] transition-colors', activePage === 'access-control' ? 'text-cyan-300' : 'group-hover:text-cyan-400/70')} />
              {!collapsed && <span className="flex-1 text-left tracking-wide">Access Control</span>}
              {activePage === 'access-control' && !collapsed && (
                <div className="w-1 h-1 rounded-full bg-cyan-400 ml-1" />
              )}
            </button>
          )}
        </nav>

        {/* Status indicator */}
        {!collapsed && (
          <div className="relative mx-3 mb-3 p-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400/70 tracking-widest uppercase font-medium">System Online</span>
            </div>
          </div>
        )}

        {/* Logout + Collapse buttons */}
        <div className="relative hidden lg:flex flex-col p-3 border-t border-cyan-500/10 gap-1">
          <button
            onClick={() => base44.auth.logout()}
            className={cn('nav-item w-full hover:text-red-400 text-muted-foreground', collapsed && 'justify-center px-2')}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="tracking-wide">Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn('nav-item w-full hover:text-cyan-400', collapsed && 'justify-center px-2')}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="tracking-wide">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}