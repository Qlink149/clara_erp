import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuthorization } from '@/lib/AuthorizationContext';
import { SUPER_ADMIN_EMAILS, INVOICE_ACCESS_EMAILS, MODULE_INVOICE, MODULE_KPI_VIEW_OWN, MODULE_PROFORMA, MODULE_DOCS_EDIT, MODULE_CLIENT_PORTAL } from '@/lib/constants';

// Cache module access records to avoid repeated fetches
let _cache = null;
let _cacheEmail = null;

async function fetchModuleAccess(email) {
  if (!email) return [];
  if (_cacheEmail === email && _cache !== null) return _cache;
  try {
    const records = await base44.entities.ModuleAccess.filter({ email });
    _cache = records;
    _cacheEmail = email;
    return records;
  } catch {
    return [];
  }
}

export function useInvoiceAccess() {
  const authz = useAuthorization();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!authz) return;
    if (authz.role === 'SUPER_ADMIN') { setGranted(true); return; }
    const email = authz.email?.toLowerCase();
    if (SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email)) { setGranted(true); return; }
    if (INVOICE_ACCESS_EMAILS.some(e => e.toLowerCase() === email)) { setGranted(true); return; }
    if (!authz.email) return;
    fetchModuleAccess(authz.email).then(records => {
      const rec = records.find(r => r.module === MODULE_INVOICE && r.is_granted);
      setGranted(!!rec);
    });
  }, [authz]);

  return granted;
}

export function useProformaAccess() {
  const authz = useAuthorization();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!authz) return;
    if (authz.role === 'SUPER_ADMIN') { setGranted(true); return; }
    const email = authz.email?.toLowerCase();
    if (SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email)) { setGranted(true); return; }
    if (INVOICE_ACCESS_EMAILS.some(e => e.toLowerCase() === email)) { setGranted(true); return; }
    if (!authz.email) return;
    fetchModuleAccess(authz.email).then(records => {
      const rec = records.find(r => r.module === MODULE_PROFORMA && r.is_granted);
      setGranted(!!rec);
    });
  }, [authz]);

  return granted;
}

export function useKpiAdminAccess() {
  const authz = useAuthorization();
  if (!authz) return false;
  return authz.role === 'SUPER_ADMIN';
}

export function useKpiViewOwnAccess() {
  const authz = useAuthorization();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!authz) return;
    if (authz.role === 'SUPER_ADMIN') { setGranted(true); return; }
    if (!authz.email) return;
    fetchModuleAccess(authz.email).then(records => {
      const rec = records.find(r => r.module === MODULE_KPI_VIEW_OWN && r.is_granted);
      setGranted(!!rec);
    });
  }, [authz]);

  return granted;
}

export function useDocsEditAccess() {
  const authz = useAuthorization();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!authz) return;
    if (authz.role === 'SUPER_ADMIN') { setGranted(true); return; }
    if (!authz.email) return;
    fetchModuleAccess(authz.email).then(records => {
      const rec = records.find(r => r.module === MODULE_DOCS_EDIT && r.is_granted);
      setGranted(!!rec);
    });
  }, [authz]);

  return granted;
}

export function useClientPortalAdminAccess() {
  const authz = useAuthorization();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!authz) return;
    if (authz.role === 'SUPER_ADMIN') { setGranted(true); return; }
    const email = authz.email?.toLowerCase();
    if (SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email)) { setGranted(true); return; }
    if (!authz.email) return;
    fetchModuleAccess(authz.email).then(records => {
      const rec = records.find(r => r.module === MODULE_CLIENT_PORTAL && r.is_granted);
      setGranted(!!rec);
    });
  }, [authz]);

  return granted;
}

export async function getModuleAccessRecords() {
  _cache = null; // force refresh
  return base44.entities.ModuleAccess.list();
}

export async function setModuleAccess(email, module, is_granted) {
  _cache = null;
  const existing = await base44.entities.ModuleAccess.filter({ email, module });
  if (existing.length > 0) {
    await base44.entities.ModuleAccess.update(existing[0].id, { is_granted });
  } else {
    await base44.entities.ModuleAccess.create({ email, module, is_granted });
  }
}