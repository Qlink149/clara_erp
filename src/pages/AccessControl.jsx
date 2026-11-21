import { Shield } from 'lucide-react';
import AccessControlPanel from '@/components/access/AccessControlPanel';
import ModuleAccessPanel from '@/components/access/ModuleAccessPanel';

export default function AccessControl() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          Access Control
        </h1>
        <p className="text-muted-foreground mt-1">Manage who can see what across the entire ERP</p>
      </div>
      <ModuleAccessPanel />
      <AccessControlPanel />
    </div>
  );
}