import { AuditView } from '@/components/audit/audit-view';

/**
 * Audit-log landing — server entry. The viewer is fully client-side
 * because filters, search, pagination, and the metadata modal need
 * interactive state. Future: pre-fetch the first page on the server
 * once `apiClient.superAdmin.audit.list()` exists.
 */
export default function AuditPage() {
  return <AuditView />;
}
