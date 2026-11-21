// Super admin configuration
export const SUPER_ADMIN_EMAIL = "yogansh@claraai.tech";
export const SUPER_ADMIN_EMAILS = ["yogansh@claraai.tech", "laksh@claraai.tech"];

// Admin users who can see ALL tasks (in addition to super admin)
// Only Yogansh (SUPER_ADMIN) sees all tasks — everyone else sees only their own
export const ADMIN_EMAILS = [];

// Users who always have access to Invoice Calendar & Proforma Generator
// (in addition to SUPER_ADMIN)
export const INVOICE_ACCESS_EMAILS = ["laksh@claraai.tech"];

// Module identifiers
export const MODULE_INVOICE = "invoice_calendar";
export const MODULE_KPI_VIEW_OWN = "kpi_tracker_view_own";
export const MODULE_PROFORMA = "proforma_invoices";
export const MODULE_DOCS_EDIT = "documentation_edit";
export const MODULE_CLIENT_PORTAL = "client_portal_admin";