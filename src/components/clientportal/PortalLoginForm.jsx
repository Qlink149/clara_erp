import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function PortalLoginForm({ onLogin, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (email && password) onLogin(email, password);
  };

  const inputCls = "login-input h-12 w-full rounded-xl border px-4 text-sm outline-none transition-all";
  const inputStyle = { background: 'rgba(255,255,255,0.94)', borderColor: 'rgb(12 8 40 / 0.12)', color: '#110d2d' };

  return (
    <div className="min-h-screen flex" style={{ background: '#eeeafc' }}>
      {/* Left — Clara.ai brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white"
        style={{
          background: `
            radial-gradient(ellipse 66% 56% at 92% 6%, rgba(118,48,242,0.97) 0%, rgba(78,28,208,0.72) 26%, rgba(42,14,165,0.38) 52%, transparent 70%),
            radial-gradient(ellipse 64% 54% at 82% 60%, rgba(16,9,148,0.99) 0%, rgba(11,7,112,0.88) 30%, rgba(7,4,72,0.54) 58%, transparent 78%),
            radial-gradient(ellipse 44% 36% at 90% 96%, rgba(102,36,214,0.68) 0%, rgba(66,20,178,0.40) 44%, transparent 64%),
            radial-gradient(ellipse 30% 24% at 15% 82%, rgba(58,18,162,0.30) 0%, transparent 56%),
            radial-gradient(ellipse 50% 44% at 50% 50%, rgba(20,10,80,0.22) 0%, transparent 65%),
            linear-gradient(142deg, #020110 0%, #040220 26%, #07042a 62%, #030116 100%)
          `,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8d57de, #5d27ca)', boxShadow: '0 8px 24px rgba(93,39,202,0.5)' }}>
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Clara.ai</span>
        </div>
        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-bold leading-tight font-display">Your engagement, in one place.</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Track discovery progress, review use cases, and access every meeting artifact from your Clara.ai engagement — securely, in real time.
          </p>
        </div>
        <p className="text-[11px] text-white/40 tracking-widest uppercase">Clara.ai · Client Portal</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute pointer-events-none rounded-full"
          style={{ width: 600, height: 600, top: -180, right: -160, background: 'radial-gradient(closest-side, rgba(141,87,222,0.3) 0%, rgba(93,39,202,0.14) 45%, transparent 70%)', filter: 'blur(50px)' }} />
        <form onSubmit={submit} className="relative w-full max-w-sm space-y-5 rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgb(12 8 40 / 0.09)', boxShadow: '0 2px 8px rgb(12 8 40 / 0.06), 0 24px 48px rgb(12 8 40 / 0.08)', backdropFilter: 'blur(16px)' }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8d57de, #1f0798)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm" style={{ color: '#110d2d' }}>Clara.ai</span>
            </div>
            <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ background: 'rgb(31 7 152 / 0.08)', border: '1px solid rgb(31 7 152 / 0.14)', color: '#1f0798' }}>
              Client Portal
            </span>
            <h1 className="text-xl font-bold font-display" style={{ color: '#110d2d' }}>Welcome back</h1>
            <p className="text-xs" style={{ color: '#6d668d' }}>Sign in with the credentials shared by the Clara.ai team</p>
          </div>
          <div className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} style={inputStyle} placeholder="Email" autoComplete="email" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} style={inputStyle} placeholder="Password" autoComplete="current-password" />
          </div>
          {error && <p className="text-xs text-center" style={{ color: '#a83060' }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            className="login-btn h-12 w-full rounded-xl text-sm font-semibold text-white outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #8d57de 0%, #5d27ca 50%, #1f0798 100%)',
              boxShadow: '0 12px 32px rgba(93,39,202,0.32)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}