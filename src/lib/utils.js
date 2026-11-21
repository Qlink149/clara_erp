import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, differenceInDays, parseISO, isValid } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatDate(dateStr, fmt = 'MMM d, yyyy') {
  if (!dateStr) return '—';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return '—';
    return format(date, fmt);
  } catch {
    return '—';
  }
}

export function daysFromToday(dateStr) {
  if (!dateStr) return null;
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return null;
    return differenceInDays(date, new Date());
  } catch {
    return null;
  }
}

export function getStatusColor(status) {
  const map = {
    'On Track': 'badge-green',
    'At Risk': 'badge-amber',
    'Delayed': 'badge-red',
    'Paused': 'badge-gray',
    'Completed': 'badge-green',
    'In Progress': 'badge-cyan',
    'Not Started': 'badge-gray',
    'Blocked': 'badge-red',
    'On Hold': 'badge-amber',
    'Lead': 'badge-gray',
    'Proposal Sent': 'badge-blue',
    'Negotiation': 'badge-amber',
    'Contract Review': 'badge-violet',
    'Closing': 'badge-green',
    'Available': 'badge-green',
    'Busy': 'badge-amber',
    'Overloaded': 'badge-red',
    'On Leave': 'badge-gray',
    'Paid': 'badge-green',
    'Partially Paid': 'badge-amber',
    'Pending': 'badge-red',
    'Awaiting': 'badge-amber',
    'Received': 'badge-green',
    'Cancelled': 'badge-gray',
  };
  return map[status] || 'badge-gray';
}

export function getPriorityColor(priority) {
  const map = {
    'Low': 'badge-gray',
    'Medium': 'badge-blue',
    'High': 'badge-amber',
    'Urgent': 'badge-red',
  };
  return map[priority] || 'badge-gray';
}

export function getTeamColor(color) {
  const map = {
    violet: 'bg-violet-500/20 text-violet-300',
    cyan: 'bg-cyan-500/20 text-cyan-300',
    amber: 'bg-amber-500/20 text-amber-300',
    green: 'bg-green-500/20 text-green-300',
    blue: 'bg-blue-500/20 text-blue-300',
  };
  return map[color] || 'bg-muted text-muted-foreground';
}

export function computeAlerts(currentClients, tasks, team, resolvedAlerts = [], snoozedAlerts = {}, engagements = []) {
  const now = new Date();
  const alerts = [];

  const isActive = (id) => {
    if (resolvedAlerts.includes(id)) return false;
    if (snoozedAlerts[id]) {
      const snoozeUntil = new Date(snoozedAlerts[id]);
      if (snoozeUntil > now) return false;
    }
    return true;
  };

  // Pending items past deadline
  currentClients.forEach((client) => {
    (client.pendingItems || []).forEach((item) => {
      const days = daysFromToday(item.deadline);
      if (item.status === 'Awaiting' && days !== null && days < 0) {
        const alertId = `pending-${item.id}`;
        if (isActive(alertId)) {
          const overdueDays = Math.abs(days);
          alerts.push({
            id: alertId,
            type: 'pending-item',
            severity: overdueDays >= 5 ? 'Critical' : overdueDays >= 2 ? 'Warning' : 'Warning',
            title: `Pending item overdue`,
            description: `"${item.description}" for ${client.name} is ${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`,
            clientId: client.id,
            clientName: client.name,
            daysOverdue: overdueDays,
            itemName: item.description,
          });
        }
      }
      // Due within 48 hours
      if (item.status === 'Awaiting' && days !== null && days >= 0 && days <= 2) {
        const alertId = `upcoming-pending-${item.id}`;
        if (isActive(alertId)) {
          alerts.push({
            id: alertId,
            type: 'upcoming-deadline',
            severity: 'Info',
            title: `Pending item due soon`,
            description: `"${item.description}" for ${client.name} is due ${days === 0 ? 'today' : `in ${days} day${days !== 1 ? 's' : ''}`}`,
            clientId: client.id,
            clientName: client.name,
            dueDate: item.deadline,
            itemName: item.description,
          });
        }
      }
    });

    // Follow-up dates passed
    if (client.communication?.nextFollowUp) {
      const days = daysFromToday(client.communication.nextFollowUp);
      if (days !== null && days < 0) {
        const alertId = `followup-${client.id}`;
        if (isActive(alertId)) {
          alerts.push({
            id: alertId,
            type: 'followup',
            severity: 'Warning',
            title: `Follow-up overdue`,
            description: `Follow-up with ${client.name} was due ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`,
            clientId: client.id,
            clientName: client.name,
            daysOverdue: Math.abs(days),
          });
        }
      }
    }

    // Contract end within 30 days
    if (client.contractEndDate) {
      const days = daysFromToday(client.contractEndDate);
      if (days !== null && days >= 0 && days <= 30) {
        const alertId = `contract-${client.id}`;
        if (isActive(alertId)) {
          alerts.push({
            id: alertId,
            type: 'contract',
            severity: days <= 7 ? 'Warning' : 'Info',
            title: `Contract ending soon`,
            description: `${client.name} contract ends in ${days} day${days !== 1 ? 's' : ''}`,
            clientId: client.id,
            clientName: client.name,
            daysRemaining: days,
          });
        }
      }
    }
  });

  // Overdue tasks
  tasks.forEach((task) => {
    if (task.status === 'Completed') return;
    const days = daysFromToday(task.deadline);
    if (days !== null && days < 0) {
      const alertId = `task-overdue-${task.id}`;
      if (isActive(alertId)) {
        const overdueDays = Math.abs(days);
        alerts.push({
          id: alertId,
          type: 'task-overdue',
          severity: task.priority === 'Urgent' || overdueDays >= 3 ? 'Critical' : 'Warning',
          title: `Task overdue`,
          description: `"${task.name}" is ${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`,
          taskId: task.id,
          taskName: task.name,
          clientId: task.clientId,
          assigneeId: task.assigneeId,
          daysOverdue: overdueDays,
          priority: task.priority,
        });
      }
    }
    // Due within 48 hours
    if (days !== null && days >= 0 && days <= 2) {
      const alertId = `task-upcoming-${task.id}`;
      if (isActive(alertId)) {
        alerts.push({
          id: alertId,
          type: 'upcoming-deadline',
          severity: 'Info',
          title: `Task due soon`,
          description: `"${task.name}" is due ${days === 0 ? 'today' : `in ${days} day${days !== 1 ? 's' : ''}`}`,
          taskId: task.id,
          taskName: task.name,
          clientId: task.clientId,
          assigneeId: task.assigneeId,
          dueDate: task.deadline,
        });
      }
    }
  });

  // Payment sprint overdue alerts
  engagements.forEach((eng) => {
    if (eng.archived) return;
    const client = currentClients.find(c => c.id === eng.clientId);
    const clientName = client?.name || eng.clientId;
    (eng.paymentSprints || []).forEach((sprint) => {
      if (!sprint.dueDate || sprint.status === 'Received') return;
      const days = daysFromToday(sprint.dueDate);
      if (days !== null && days < 0) {
        const overdueDays = Math.abs(days);
        const alertId = `sprint-overdue-${sprint.id}`;
        if (isActive(alertId)) {
          alerts.push({
            id: alertId,
            type: 'sprint-overdue',
            severity: overdueDays > 7 ? 'Critical' : 'Critical',
            title: `Payment sprint overdue`,
            description: `Sprint "${sprint.name}" for ${clientName} / ${eng.name} is ${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`,
            clientId: eng.clientId,
            clientName,
            engagementId: eng.id,
            engagementName: eng.name,
            sprintId: sprint.id,
            sprintName: sprint.name,
            daysOverdue: overdueDays,
          });
        }
      }
    });
  });

  // Overloaded team members
  team.forEach((member) => {
    if (member.status === 'Overloaded') {
      const alertId = `overloaded-${member.id}`;
      if (isActive(alertId)) {
        alerts.push({
          id: alertId,
          type: 'overloaded',
          severity: 'Warning',
          title: `Team member overloaded`,
          description: `${member.name} is currently overloaded`,
          memberId: member.id,
          memberName: member.name,
        });
      }
    }
  });

  return alerts.sort((a, b) => {
    const order = { Critical: 0, Warning: 1, Info: 2 };
    return order[a.severity] - order[b.severity];
  });
}