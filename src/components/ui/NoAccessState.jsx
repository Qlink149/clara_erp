import { Lock } from 'lucide-react';

export default function NoAccessState({ message = "You don't have access to any projects yet. Contact Yogansh to get authorized." }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="card-glass p-10 flex flex-col items-center text-center max-w-md w-full"
        style={{ border: '1px solid rgba(0,212,255,0.15)', boxShadow: '0 0 40px rgba(0,212,255,0.05)' }}>
        <Lock className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Access</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>
    </div>
  );
}