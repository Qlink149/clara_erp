import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Users, ChevronRight, Loader2 } from 'lucide-react';

export default function OnboardingGate({ user, onComplete }) {
  const [step, setStep] = useState('role'); // 'role' | 'client-select'
  const [selectedType, setSelectedType] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await base44.functions.invoke('getData', {});
      const list = (res.data?.clients || []).sort((a, b) => a.name.localeCompare(b.name));
      setClients(list);
    } catch (e) {
      console.error(e);
    }
    setLoadingClients(false);
  };

  const handleRoleSelect = async (type) => {
    setSelectedType(type);
    if (type === 'client') {
      await fetchClients();
      setStep('client-select');
    } else {
      // Employee — submit right away
      setLoading(true);
      await base44.functions.invoke('submitAccessRequest', { userType: 'employee' });
      setLoading(false);
      onComplete({ userType: 'employee' });
    }
  };

  const handleClientSubmit = async () => {
    if (!selectedClientId) return;
    setLoading(true);
    await base44.functions.invoke('submitAccessRequest', { userType: 'client', linkedClientId: selectedClientId });
    setLoading(false);
    onComplete({ userType: 'client', linkedClientId: selectedClientId });
  };

  const firstName = (user?.full_name || user?.email || '').split(' ')[0];

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1526 50%, #0a0f1e 100%)',
      }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 animate-glow-pulse"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.9), rgba(0,150,200,0.9))', boxShadow: '0 0 24px rgba(0,212,255,0.4)' }}>
            <span className="text-[#050a14] font-bold text-lg">C</span>
          </div>
          <h1 className="text-xl font-bold text-white">Welcome to Clara.ai</h1>
          <p className="text-sm text-cyan-500/60 mt-1">Hi {firstName} 👋 Let's get you set up</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(4,8,18,0.98) 0%, rgba(6,12,24,0.98) 100%)',
            border: '1px solid rgba(0,212,255,0.15)',
            boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Top accent line */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)' }} />

          <div className="p-8">
            {step === 'role' && (
              <>
                <h2 className="text-lg font-bold text-white text-center mb-2">Who are you?</h2>
                <p className="text-sm text-center text-white/50 mb-6">This helps us show you the right portal</p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleRoleSelect('employee')}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all group"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white text-sm">I'm a Team Member</p>
                      <p className="text-xs text-white/40 mt-0.5">Employee or internal staff at Clara.ai</p>
                    </div>
                    {loading && selectedType === 'employee'
                      ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      : <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-cyan-400 transition-colors" />
                    }
                  </button>

                  <button
                    onClick={() => handleRoleSelect('client')}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all group"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <Building2 className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white text-sm">I'm a Client</p>
                      <p className="text-xs text-white/40 mt-0.5">Access your project portal and documents</p>
                    </div>
                    {loadingClients
                      ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      : <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 transition-colors" />
                    }
                  </button>
                </div>
              </>
            )}

            {step === 'client-select' && (
              <>
                <button
                  onClick={() => setStep('role')}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 mb-4 transition-colors"
                >
                  ← Back
                </button>
                <h2 className="text-lg font-bold text-white mb-2">Which company are you from?</h2>
                <p className="text-sm text-white/50 mb-6">Select your company to access your client portal</p>

                {loadingClients ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="relative mb-4">
                      <select
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        className="w-full appearance-none bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 pr-10"
                      >
                        <option value="">Select your company...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 rotate-90 pointer-events-none" />
                    </div>

                    <button
                      onClick={handleClientSubmit}
                      disabled={!selectedClientId || loading}
                      className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.9), rgba(217,119,6,0.9))',
                        color: '#0a0f1e',
                        boxShadow: selectedClientId ? '0 0 20px rgba(245,158,11,0.3)' : 'none',
                      }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Access My Portal
                    </button>

                    <p className="text-xs text-center text-white/30 mt-4">
                      Your access request will be reviewed by the Clara.ai team. You'll see a preview until approved.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}