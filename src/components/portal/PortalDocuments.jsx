import { useState } from 'react';
import { Search, Eye, Download, FileText, Image, File, Link, ChevronDown, ChevronRight } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';

function fileIcon(type) {
  if (!type) return <File className="w-4 h-4 text-muted-foreground" />;
  if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-400" />;
  if (type.includes('word') || type.includes('doc')) return <FileText className="w-4 h-4 text-blue-400" />;
  if (type.includes('sheet') || type.includes('excel') || type.includes('xls')) return <FileText className="w-4 h-4 text-green-400" />;
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) return <Image className="w-4 h-4 text-amber-400" />;
  if (type === 'link') return <Link className="w-4 h-4 text-cyan-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

export default function PortalDocuments({ documents, engagements }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [collapsed, setCollapsed] = useState({});

  const filtered = documents
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.addedAt) - new Date(a.addedAt);
      if (sort === 'oldest') return new Date(a.addedAt) - new Date(b.addedAt);
      return a.name.localeCompare(b.name);
    });

  const byEngagement = engagements.map(eng => ({
    engagement: eng,
    docs: filtered.filter(d => d.engagementId === eng.id || (!d.engagementId && d.clientId)),
  })).filter(g => g.docs.length > 0);

  const ungrouped = filtered.filter(d => !engagements.some(e => d.engagementId === e.id));

  if (documents.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <FileText className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No documents shared yet</h3>
        <p className="text-muted-foreground">Documents will appear here as your Clara team shares them.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-muted-foreground mt-1">All shared files from your Clara projects</p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/40" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Documents grouped by project */}
      {byEngagement.map(({ engagement, docs }) => {
        const isCollapsed = collapsed[engagement.id];
        return (
          <div key={engagement.id} className="rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => setCollapsed(c => ({ ...c, [engagement.id]: !c[engagement.id] }))}
              className="w-full flex items-center justify-between px-5 py-4 bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm font-semibold text-foreground">{engagement.name}</span>
                <span className="text-xs text-muted-foreground">({docs.length} file{docs.length > 1 ? 's' : ''})</span>
              </div>
            </button>
            {!isCollapsed && (
              <div className="divide-y divide-border">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex-shrink-0">{fileIcon(doc.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.category} · {formatRelative(doc.addedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors">
                          <Eye className="w-3 h-3" /> View
                        </a>
                      )}
                      {doc.type !== 'link' && doc.url && (
                        <a href={doc.url} download
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}