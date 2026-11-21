import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Drawer({ open, onClose, title, children, width = 'max-w-2xl' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className={cn('w-full flex flex-col h-full overflow-hidden animate-slide-in', width)}
        style={{
          background: 'linear-gradient(180deg, rgba(4,8,20,0.99) 0%, rgba(3,6,15,0.99) 100%)',
          borderLeft: '1px solid rgba(0,212,255,0.12)',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.6), -4px 0 20px rgba(0,212,255,0.05)',
        }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Left accent line */}
        <div className="absolute left-0 top-12 bottom-12 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.4), transparent)' }} />

        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.4), transparent)' }} />
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #00d4ff, rgba(0,212,255,0.2))' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}