import { useState, useEffect } from 'react';
import { FileText, Plus, List, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useInvoiceAccess } from '@/lib/moduleAccess';
import NoAccessState from '@/components/ui/NoAccessState';
import GenerateInvoiceTab from '@/components/invoice/GenerateInvoiceTab';
import InvoiceRegisterTab from '@/components/invoice/InvoiceRegisterTab';
import CompanySettingsTab from '@/components/invoice/CompanySettingsTab';
import { useStore } from '@/lib/StoreContext';

const TABS = [
  { id: 'generate', label: 'Generate Invoice', icon: Plus },
  { id: 'register', label: 'Invoice Register', icon: List },
  { id: 'settings', label: 'Company Settings', icon: Settings },
];

export default function ProformaInvoices({ prefillEntry: externalPrefill, onClearPrefill }) {
  const canSee = useInvoiceAccess();
  const [activeTab, setActiveTab] = useState('generate');
  const [prefillEntry, setPrefillEntry] = useState(externalPrefill || null);
  const [editConfirmPending, setEditConfirmPending] = useState(null); // invoice awaiting edit confirm
  const { clients } = useStore();
  const allClients = clients || [];

  // When external prefill arrives (from Invoice Calendar), apply it
  useEffect(() => {
    if (externalPrefill) {
      setPrefillEntry(externalPrefill);
      setActiveTab('generate');
      onClearPrefill && onClearPrefill();
    }
  }, [externalPrefill]);

  const handleEditInvoice = (inv) => {
    // Show confirmation before switching to edit mode
    setEditConfirmPending(inv);
  };

  const confirmEdit = () => {
    const inv = editConfirmPending;
    setEditConfirmPending(null);
    // Flag so GenerateInvoiceTab knows this is an edit-existing flow
    setPrefillEntry({ ...inv, _editMode: true });
    setActiveTab('generate');
  };

  if (!canSee) return <NoAccessState message="Proforma Invoices is restricted. Contact Yogansh to get access." />;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          Proforma Invoices
        </h1>
        <p className="text-muted-foreground mt-1">Generate, track, and manage all proforma invoices</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all -mb-px',
              activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && (
        <GenerateInvoiceTab
          allClients={allClients}
          prefillEntry={prefillEntry}
          onClearPrefill={() => setPrefillEntry(null)}
          onSaved={() => setActiveTab('register')}
        />
      )}
      {activeTab === 'register' && (
        <InvoiceRegisterTab
          allClients={allClients}
          onEditInvoice={handleEditInvoice}
        />
      )}
      {activeTab === 'settings' && <CompanySettingsTab />}

      {/* Edit Confirmation Dialog */}
      {editConfirmPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-foreground">Edit Invoice</h3>
            <p className="text-sm text-muted-foreground">
              Editing <span className="text-foreground font-semibold">Invoice #{editConfirmPending.invoiceNumber}</span> will update the saved record. The original invoice number will be preserved. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditConfirmPending(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={confirmEdit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                Confirm Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}