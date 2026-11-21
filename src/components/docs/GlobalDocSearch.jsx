import { useMemo } from 'react';
import { FileText, Link, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export default function GlobalDocSearch({ query, docs, assets, allClients, onSelectClient }) {
  const q = query.toLowerCase();

  const clientName = (id) => allClients.find(c => c.id === id)?.name || 'Unknown';

  const matchedDocs = useMemo(() => docs.filter(d =>
    d.title?.toLowerCase().includes(q) ||
    d.docType?.toLowerCase().includes(q) ||
    d.docTypeCustom?.toLowerCase().includes(q) ||
    d.notes?.toLowerCase().includes(q) ||
    d.status?.toLowerCase().includes(q) ||
    clientName(d.clientId).toLowerCase().includes(q)
  ), [docs, q]);

  const matchedAssets = useMemo(() => assets.filter(a =>
    a.label?.toLowerCase().includes(q) ||
    a.assetType?.toLowerCase().includes(q) ||
    a.assetTypeCustom?.toLowerCase().includes(q) ||
    a.url?.toLowerCase().includes(q) ||
    a.notes?.toLowerCase().includes(q) ||
    clientName(a.clientId).toLowerCase().includes(q)
  ), [assets, q]);

  const total = matchedDocs.length + matchedAssets.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{total} result{total !== 1 ? 's' : ''} for "<span className="text-foreground font-medium">{query}</span>"</p>

      {total === 0 && (
        <div className="card-glass p-10 text-center">
          <p className="text-muted-foreground text-sm">No documents or assets match your search.</p>
        </div>
      )}

      {matchedDocs.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Legal Documents ({matchedDocs.length})</p>
          <div className="space-y-2">
            {matchedDocs.map(doc => (
              <div key={doc.id} className="card-glass p-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{doc.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground">{doc.docType === 'Other' && doc.docTypeCustom ? doc.docTypeCustom : doc.docType}</span>
                    <span className="text-[10px] text-muted-foreground">{doc.signedDate && format(parseISO(doc.signedDate), 'dd MMM yyyy')}</span>
                  </div>
                  <p className="text-xs text-primary mt-0.5">{clientName(doc.clientId)}</p>
                </div>
                <button onClick={() => onSelectClient(doc.clientId)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {matchedAssets.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Digital Assets ({matchedAssets.length})</p>
          <div className="space-y-2">
            {matchedAssets.map(asset => (
              <div key={asset.id} className="card-glass p-3 flex items-center gap-3">
                <Link className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{asset.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground">{asset.assetType === 'Other' && asset.assetTypeCustom ? asset.assetTypeCustom : asset.assetType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-primary">{clientName(asset.clientId)}</p>
                    {asset.url && <a href={asset.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline truncate max-w-xs">{asset.url}</a>}
                  </div>
                </div>
                <button onClick={() => onSelectClient(asset.clientId)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}