import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function ClientSearchCombobox({ clients, value, onSelect, placeholder = "Search client..." }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedClient = clients.find(c => c.id === value);

  useEffect(() => {
    if (!open) {
      if (selectedClient) setSearch(selectedClient.name);
      else setSearch('');
    }
  }, [value, selectedClient, open]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    : clients;

  const handleSelect = (client) => {
    onSelect(client.id);
    setSearch(client.name);
    setOpen(false);
  };

  const handleFocus = (e) => {
    setOpen(true);
    if (e?.target?.select) e.target.select();
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="bg-input border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 w-full"
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-popover border border-border rounded-lg shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No clients found</div>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors ${c.id === value ? 'text-primary font-medium' : 'text-foreground'}`}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}