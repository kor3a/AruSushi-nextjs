export type UserRole = 'customer' | 'manager' | 'admin';

const DEFAULT_ADMIN_EMAILS = ['kor3a5@gmail.com'];

function parseEmailList(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

function getConfiguredAdminEmails(): string[] {
  const privateAdmins = parseEmailList(process.env.ADMIN_EMAILS);
  const publicAdmins = parseEmailList(process.env.NEXT_PUBLIC_ADMIN_EMAILS);
  return [...DEFAULT_ADMIN_EMAILS, ...privateAdmins, ...publicAdmins];
}

function getConfiguredManagerEmails(): string[] {
  const privateManagers = parseEmailList(process.env.MANAGER_EMAILS);
  const publicManagers = parseEmailList(process.env.NEXT_PUBLIC_MANAGER_EMAILS);
  return [...privateManagers, ...publicManagers];
}

export function getUserRoleByEmail(email?: string | null): UserRole {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return 'customer';
  }

  const adminEmails = new Set(getConfiguredAdminEmails());
  if (adminEmails.has(normalizedEmail)) {
    return 'admin';
  }

  const managerEmails = new Set(getConfiguredManagerEmails());
  if (managerEmails.has(normalizedEmail)) {
    return 'manager';
  }

  return 'customer';
}

export function canManageOrders(email?: string | null): boolean {
  const role = getUserRoleByEmail(email);
  return role === 'admin' || role === 'manager';
}
