/**
 * Mock super-admin team + invitation data. Replace with the
 * `/api/v1/super-admin/admins` + `.../invitations` endpoints once
 * the Laravel backend exposes them.
 */

import type { SuperAdminRole } from '@/stores/auth';

export type SuperAdminTeamMember = {
  id: string;
  name: string;
  email: string;
  role: SuperAdminRole;
  avatar_url: string | null;
  mfa_enabled: boolean;
  status: 'active' | 'disabled';
  last_super_admin_login_at: string | null;
  created_at: string;
};

export type SuperAdminInvitationStatus = 'pending' | 'expired' | 'accepted';

export type SuperAdminInvitation = {
  id: string;
  email: string;
  role: SuperAdminRole;
  invited_by_id: string;
  invited_by_name: string;
  status: SuperAdminInvitationStatus;
  /** Sample invitation link the inviter can share manually. */
  invitation_url: string;
  created_at: string;
  expires_at: string;
};

/** Pinned "now" so dates stay deterministic for snapshot tests. */
const BASE_NOW = new Date('2026-04-25T17:30:00Z').getTime();
const isoDaysAgo = (days: number): string =>
  new Date(BASE_NOW - days * 24 * 60 * 60 * 1000).toISOString();
const isoHoursAgo = (hours: number): string =>
  new Date(BASE_NOW - hours * 60 * 60 * 1000).toISOString();
const isoDaysAhead = (days: number): string =>
  new Date(BASE_NOW + days * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_SUPER_ADMINS: SuperAdminTeamMember[] = [
  {
    id: 'sa-1',
    name: 'Akbar Rasulov',
    email: 'akbar@mypos.uz',
    role: 'owner',
    avatar_url: null,
    mfa_enabled: true,
    status: 'active',
    last_super_admin_login_at: isoHoursAgo(1),
    created_at: '2025-04-01T00:00:00Z',
  },
  {
    id: 'sa-2',
    name: 'Dilshod Karimov',
    email: 'dilshod@mypos.uz',
    role: 'admin',
    avatar_url: null,
    mfa_enabled: true,
    status: 'active',
    last_super_admin_login_at: isoHoursAgo(4),
    created_at: '2025-06-12T00:00:00Z',
  },
  {
    id: 'sa-3',
    name: 'Bobur Yusupov',
    email: 'bobur@mypos.uz',
    role: 'finance',
    avatar_url: null,
    mfa_enabled: true,
    status: 'active',
    last_super_admin_login_at: isoHoursAgo(26),
    created_at: '2025-09-03T00:00:00Z',
  },
  {
    id: 'sa-4',
    name: 'Nigora Saidova',
    email: 'nigora@mypos.uz',
    role: 'support',
    avatar_url: null,
    mfa_enabled: false,
    status: 'active',
    last_super_admin_login_at: isoDaysAgo(3),
    created_at: '2025-12-18T00:00:00Z',
  },
  {
    id: 'sa-5',
    name: 'Sherzod Tursunov',
    email: 'sherzod@mypos.uz',
    role: 'developer',
    avatar_url: null,
    mfa_enabled: true,
    status: 'active',
    last_super_admin_login_at: isoHoursAgo(8),
    created_at: '2026-01-22T00:00:00Z',
  },
  {
    id: 'sa-6',
    name: 'Madina Olimova',
    email: 'madina@mypos.uz',
    role: 'support',
    avatar_url: null,
    mfa_enabled: false,
    status: 'disabled',
    last_super_admin_login_at: isoDaysAgo(28),
    created_at: '2025-11-09T00:00:00Z',
  },
];

export const MOCK_INVITATIONS: SuperAdminInvitation[] = [
  {
    id: 'inv-1',
    email: 'kamila@mypos.uz',
    role: 'finance',
    invited_by_id: 'sa-1',
    invited_by_name: 'Akbar Rasulov',
    status: 'pending',
    invitation_url: 'https://admin.mypos.uz/invite/accept?token=demo-tok-1',
    created_at: isoHoursAgo(6),
    expires_at: isoDaysAhead(3),
  },
  {
    id: 'inv-2',
    email: 'support+ops@mypos.uz',
    role: 'support',
    invited_by_id: 'sa-2',
    invited_by_name: 'Dilshod Karimov',
    status: 'pending',
    invitation_url: 'https://admin.mypos.uz/invite/accept?token=demo-tok-2',
    created_at: isoDaysAgo(1),
    expires_at: isoDaysAhead(2),
  },
  {
    id: 'inv-3',
    email: 'old.staff@mypos.uz',
    role: 'admin',
    invited_by_id: 'sa-1',
    invited_by_name: 'Akbar Rasulov',
    status: 'expired',
    invitation_url: 'https://admin.mypos.uz/invite/accept?token=demo-tok-3',
    created_at: isoDaysAgo(10),
    expires_at: isoDaysAgo(3),
  },
];
