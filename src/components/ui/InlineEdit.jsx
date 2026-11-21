import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function InlineTextEdit({ value, onSave, className, placeholder = 'Click to edit', multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setVal(value || ''); }, [value]);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setVal(value || ''); } }}
          className={cn('bg-input border border-primary/50 rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none w-full min-h-[80px]', className)}
        />
      );
    }
    return (
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setVal(value || ''); } }}
        className={cn('bg-input border border-primary/50 rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 w-full', className)}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn('inline-edit cursor-pointer', !value && 'text-muted-foreground italic', className)}
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  );
}

export function InlineSelectEdit({ value, options, onSave, className }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => { onSave(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        className={cn('bg-input border border-primary/50 rounded px-2 py-1 text-sm text-foreground focus:outline-none', className)}
      >
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn('inline-edit cursor-pointer', className)}
      title="Click to edit"
    >
      {value || '—'}
    </span>
  );
}

export function InlineDateEdit({ value, onSave, className }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={ref}
        type="date"
        value={value || ''}
        onChange={(e) => { onSave(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        className={cn('bg-input border border-primary/50 rounded px-2 py-1 text-sm text-foreground focus:outline-none', className)}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn('inline-edit cursor-pointer', className)}
      title="Click to edit"
    >
      {value || '—'}
    </span>
  );
}

export function InlineNumberEdit({ value, onSave, className, suffix = '' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setVal(value || ''); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const save = () => {
    setEditing(false);
    const num = parseFloat(val);
    if (!isNaN(num) && num !== value) onSave(num);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className={cn('bg-input border border-primary/50 rounded px-2 py-1 text-sm text-foreground focus:outline-none w-20', className)}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn('inline-edit cursor-pointer', className)}
      title="Click to edit"
    >
      {value !== null && value !== undefined ? `${value}${suffix}` : '—'}
    </span>
  );
}