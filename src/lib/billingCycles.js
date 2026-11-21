import { addDays, addMonths, endOfMonth, parseISO, format, startOfDay } from 'date-fns';

export const CYCLES = {
  'One-time': { once: true },
  '10 days': { days: 10 },
  '15 days': { days: 15 },
  '30 days': { days: 30 },
  '60 days': { days: 60 },
  'Monthly': { months: 1 },
  'Quarterly': { months: 3 },
  '6 months': { months: 6 },
  'Yearly': { months: 12 },
};

const step = (d, c) => (c.days ? addDays(d, c.days) : addMonths(d, c.months));

// All invoice dates of a plan that fall inside the given month
export function datesInMonth(plan, monthStart) {
  const c = CYCLES[plan.billingCycle] || CYCLES.Monthly;
  const end = endOfMonth(monthStart);
  const out = [];
  let d = startOfDay(parseISO(plan.firstInvoiceDate));
  for (let i = 0; d <= end && i < 2000; i++) {
    if (d >= monthStart) out.push(format(d, 'yyyy-MM-dd'));
    if (c.once) break;
    d = step(d, c);
  }
  return out;
}

// Next invoice date on or after today
export function nextDate(plan) {
  const c = CYCLES[plan.billingCycle] || CYCLES.Monthly;
  const today = startOfDay(new Date());
  let d = startOfDay(parseISO(plan.firstInvoiceDate));
  if (c.once) return d >= today ? format(d, 'yyyy-MM-dd') : null;
  for (let i = 0; d < today && i < 2000; i++) d = step(d, c);
  return format(d, 'yyyy-MM-dd');
}

export const STATUS_STYLE = {
  Pending: 'badge-amber',
  Overdue: 'badge-red',
  Generated: 'badge-violet',
  Sent: 'badge-blue',
  Received: 'badge-green',
};

export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;