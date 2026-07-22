export type AgencyPlan = 'free_trial' | 'starter' | 'pro';

export type UserRole = 'super_admin' | 'agency_admin' | 'client_owner' | 'sales_manager' | 'sales_executive';

export type LeadStage = 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'QUALIFIED' | 'NEGOTIATION' | 'WON' | 'LOST' | 'BOOKED' | 'NO_NEED' | 'WRONG_LEAD' | 'CALL_NOT_ATTENDED';

export type FollowUpStatus = 'pending' | 'done' | 'missed';

export interface Agency {
  id: string;
  name: string;
  email: string;
  plan: AgencyPlan;
  trialEndsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MetaTokenStatus = 'CONNECTED' | 'EXPIRED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';

export interface Client {
  id: string;
  agencyId: string;
  businessName: string;
  email: string;
  metaAccessToken?: string | null;
  metaAdAccountId?: string | null;
  metaPageId?: string | null;
  metaFormId?: string | null;
  metaBusinessId?: string | null;
  metaConnectedAt?: string | null;
  metaLastSyncAt?: string | null;
  metaTokenStatus?: MetaTokenStatus | null;
  metaPageName?: string | null;
  metaPageAccessToken?: string | null;
  metaAdAccountName?: string | null;
  metaAdSpend: number;
  tokenExpiresAt?: string | null;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  agencyId?: string | null;
  clientId?: string | null;
  role: UserRole;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  clientId: string;
  agencyId: string;
  metaLeadId?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  stage: LeadStage;
  source?: string | null;
  city?: string | null;
  leadSource?: string | null;
  status?: string | null;
  createdBy?: string | null;
  assignedTo?: string | null;
  campaignName?: string | null;
  pageName?: string | null;
  adAccountName?: string | null;
  metaCreatedAt?: string | null;
  customFields?: Record<string, any> | null;
  proposalSentAt?: string | null;
  proposalSalesperson?: string | null;
  proposalNotes?: string | null;
  lastActivityAt?: string;
  lastActivityType?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser?: Partial<User> | null;
  nextFollowUp?: FollowUp | null;
  followUps?: FollowUp[];
  callAttempts?: number;
  lastCallResult?: string | null;
}

export interface FollowUp {
  id: string;
  leadId: string;
  clientId: string;
  agencyId: string;
  scheduledAt: string;
  note?: string | null;
  status: FollowUpStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: Lead;
}

export interface Sale {
  id: string;
  leadId: string;
  clientId: string;
  agencyId: string;
  amount: number;
  currency: string;
  closedAt: string;
  createdAt: string;
  updatedAt: string;
  lead?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface ActivityLog {
  id: string;
  leadId: string;
  userId: string;
  clientId: string;
  agencyId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User> | null;
}
