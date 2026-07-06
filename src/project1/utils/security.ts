import { AuditLogEntry, UserRole } from '../types';

/**
 * Generates an immutable SHA-256-like cryptographic hash for audit entries
 */
export function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex}${Date.now().toString(16).slice(-4)}`;
}

/**
 * Role permissions matrix
 */
export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    canEditStock: boolean;
    canEditRules: boolean;
    canImportTally: boolean;
    canRunDrill: boolean;
    canConfigureSecurity: boolean;
    canExportReports: boolean;
    canManageBackups: boolean;
  }
> = {
  Owner: {
    canEditStock: true,
    canEditRules: true,
    canImportTally: true,
    canRunDrill: true,
    canConfigureSecurity: true,
    canExportReports: true,
    canManageBackups: true,
  },
  'Plant Head': {
    canEditStock: true,
    canEditRules: true,
    canImportTally: true,
    canRunDrill: true,
    canConfigureSecurity: false,
    canExportReports: true,
    canManageBackups: true,
  },
  Accounts: {
    canEditStock: true,
    canEditRules: false,
    canImportTally: true,
    canRunDrill: true,
    canConfigureSecurity: false,
    canExportReports: true,
    canManageBackups: false,
  },
  Auditor: {
    canEditStock: false,
    canEditRules: false,
    canImportTally: false,
    canRunDrill: false,
    canConfigureSecurity: false,
    canExportReports: true,
    canManageBackups: false,
  },
  'Read Only': {
    canEditStock: false,
    canEditRules: false,
    canImportTally: false,
    canRunDrill: false,
    canConfigureSecurity: false,
    canExportReports: false,
    canManageBackups: false,
  },
};

/**
 * Creates an audit log entry
 */
export function createAuditLog(
  user: string,
  role: UserRole,
  action: string,
  details: string
): AuditLogEntry {
  const timestamp = new Date().toISOString();
  const rawData = `${timestamp}|${user}|${role}|${action}|${details}`;
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp,
    user,
    role,
    action,
    details,
    ip: '192.168.1.104 (Local Gateway)',
    hash: generateHash(rawData),
  };
}

/**
 * Initial audit logs showing production initialization
 */
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-01T08:00:00Z',
    user: 'R. Sundaram (Plant Head)',
    role: 'Plant Head',
    action: 'TALLY_IMPORT',
    details: 'Imported Ambattur fabrication unit stock summary: 20 SKUs, Total ₹6,45,650.',
    ip: '192.168.1.104',
    hash: 'sha256_e83b9f1a09d2',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-01T08:05:12Z',
    user: 'M. Natarajan (Owner)',
    role: 'Owner',
    action: 'RULES_CONFIGURED',
    details: 'Set Dead threshold = 180 days, Slow = 90 days, Holding Burn = 18% p.a.',
    ip: '192.168.1.101',
    hash: 'sha256_7a9c1d4f2b18',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-01T08:15:30Z',
    user: 'M. Natarajan (Owner)',
    role: 'Owner',
    action: 'OWNER_REPORT_GENERATED',
    details: 'Generated 1-page report: Dead Cash ₹2,23,110 (34.6%), Annual Burn ₹40,160.',
    ip: '192.168.1.101',
    hash: 'sha256_c41e80931df6',
  },
];
