import { AdminUser } from './types';

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatRelativeTime(value?: string | null): string {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffMs = date.getTime() - Date.now();
  const absSeconds = Math.round(Math.abs(diffMs) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (absSeconds < 60) {
    return formatter.format(Math.round(diffMs / 1000), 'second');
  }

  const absMinutes = Math.round(absSeconds / 60);
  if (absMinutes < 60) {
    return formatter.format(Math.round(diffMs / (60 * 1000)), 'minute');
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) {
    return formatter.format(Math.round(diffMs / (60 * 60 * 1000)), 'hour');
  }

  return formatter.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), 'day');
}

export function initialsFromEmail(email: string): string {
  const cleaned = email.split('@')[0]?.replace(/[^a-zA-Z0-9]+/g, ' ') ?? email;
  const parts = cleaned.split(' ').filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || email.slice(0, 2).toUpperCase();
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function canManageRecord(ownerId: string, admin: AdminUser | null): boolean {
  if (!admin) {
    return false;
  }

  return admin.is_superuser || admin.id === ownerId;
}

export function toDateTimeInputValue(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeInputValue(value: string): string | null {
  if (!value.trim()) {
    return null;
  }

  return new Date(value).toISOString();
}

export function formatAuditChange(meta: Record<string, unknown>): string {
  const entity = typeof meta.entity === 'string' ? meta.entity : 'record';
  const changes = meta.changes;
  const details = meta.details;

  if (!changes || typeof changes !== 'object') {
    if (details && typeof details === 'object') {
      const summary = Object.entries(details as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string' && value)
        .filter(([key]) => key !== 'doc_route_id')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

      if (summary) {
        return `${entity}: ${summary}.`;
      }
    }

    return `Updated ${entity}.`;
  }

  const keys = Object.keys(changes as Record<string, unknown>);
  if (keys.length === 0) {
    return `Updated ${entity}.`;
  }

  return `Updated ${entity}: ${keys.join(', ')}.`;
}
