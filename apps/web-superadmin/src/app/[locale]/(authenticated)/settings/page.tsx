import { SettingsView } from '@/components/settings/settings-view';

/**
 * Platform settings — server entry. The view stays client-side because
 * each section owns local form state and a "save" button that fires a
 * mutation against `/api/v1/super-admin/settings/*` (mock for now).
 */
export default function SettingsPage() {
  return <SettingsView />;
}
