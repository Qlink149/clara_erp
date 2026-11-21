import { useState } from 'react';
import { MessageCircle, Send, CheckCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const YOGANSH = {
  name: 'Yogansh Bhantia',
  role: 'CEO & Founder',
  email: 'yogansh@claraai.tech',
  phone: null,
};

export default function PortalContact({ engagements, client }) {
  const [form, setForm] = useState({ subject: '', message: '', engagementId: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Collect unique POCs from engagements
  const pocs = [];
  const seenNames = new Set();
  for (const eng of engagements) {
    const poc = eng.poc;
    if (poc?.name && !seenNames.has(poc.name)) {
      seenNames.add(poc.name);
      pocs.push({
        ...poc,
        projects: engagements.filter(e => e.poc?.name === poc.name).map(e => e.name),
      });
    }
  }

  const handleSend = async () => {
    if (!form.message.trim()) return;
    setSending(true);
    await base44.functions.invoke('clientPortalAction', {
      action: 'sendMessage',
      clientId: client?.id,
      engagementId: form.engagementId || null,
      subject: form.subject,
      message: form.message,
    });
    setSending(false);
    setSent(true);
    setForm({ subject: '', message: '', engagementId: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contact Clara</h1>
        <p className="text-muted-foreground mt-1">Your dedicated team is here to help</p>
      </div>

      {/* Your Clara Team */}
      <div className="space-y-3">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Your Clara Team</h2>

        {/* Yogansh — always shown */}
        <div className="rounded-2xl p-5 border border-amber-500/15"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(4,8,18,0.8) 100%)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>Y</div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground">{YOGANSH.name}</p>
              <p className="text-sm text-amber-400/80">{YOGANSH.role}</p>
              <a href={`mailto:${YOGANSH.email}`} className="text-xs text-muted-foreground hover:text-foreground mt-1 block">{YOGANSH.email}</a>
              <a href={`https://wa.me/91?text=Hi Yogansh, I have a question about my project at Clara.`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* POC cards */}
        {pocs.map((poc, i) => (
          <div key={i} className="rounded-2xl p-5 border border-border bg-secondary/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 bg-secondary border border-border text-foreground">
                {poc.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground">{poc.name}</p>
                {poc.role && <p className="text-sm text-muted-foreground">{poc.role}</p>}
                <p className="text-xs text-amber-400/70 mt-0.5">Your contact for: {poc.projects.join(', ')}</p>
                {poc.phone && (
                  <a href={`tel:${poc.phone}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2">
                    <Phone className="w-3 h-3" /> {poc.phone}
                  </a>
                )}
                {poc.phone && (
                  <a href={`https://wa.me/${poc.phone.replace(/\D/g, '')}?text=Hi ${poc.name}, I have a question about my ${poc.projects[0]} project.`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 ml-3 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message form */}
      <div className="space-y-4">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Leave a Note for the Clara Team</h2>

        <div className="rounded-2xl p-6 border border-border bg-secondary/20 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Subject (optional)</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)}
              placeholder="e.g. Question about timeline"
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Message *</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)}
              rows={4} placeholder="Write your message here..."
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/40 transition-colors resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Related Project</label>
            <select value={form.engagementId} onChange={e => set('engagementId', e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/40">
              <option value="">General</option>
              {engagements.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {sent && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-sm text-green-300 font-medium">Message sent! The Clara team will get back to you shortly.</p>
            </div>
          )}

          <button onClick={handleSend} disabled={!form.message.trim() || sending}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'rgba(245,158,11,0.9)', color: '#050a14' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(245,158,11,1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.9)'; }}>
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}