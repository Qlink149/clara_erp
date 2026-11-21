import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className={cn('relative w-full rounded-2xl shadow-2xl animate-fade-in overflow-hidden', sizes[size])}
        style={{
          background: 'linear-gradient(135deg, rgba(4,8,18,0.98) 0%, rgba(6,12,24,0.98) 100%)',
          border: '1px solid rgba(0,212,255,0.15)',
          boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)' }} />

        {/* Grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #00d4ff, rgba(0,212,255,0.2))' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}