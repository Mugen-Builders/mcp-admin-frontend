export type View = 'dashboard' | 'detail' | 'admin' | 'sources' | 'repositories' | 'tags';

export type ToastTone = 'success' | 'error' | 'info';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  last_seen_at?: string | null;
  is_online?: boolean;
};

export type AuthToken = {
  access_token: string;
  token_type: string;
};

export type AuthVerifyResponse = {
  verified: boolean;
  admin: AdminUser;
  token: AuthToken;
};

export type StoredSession = {
  admin: AdminUser;
  token: string;
};

export type Source = {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
};

export type Tag = {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
};

export type Resource = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  is_repository: boolean;
  is_documentation: boolean;
  source_id: string;
  created_by: string;
  created_at: string;
  tag_ids: string[];
  repository_id: string | null;
  last_synced_at: string | null;
};

export type Repository = {
  id: string;
  resource_id: string;
  title: string;
  url: string;
  description: string | null;
  source_id: string;
  is_repository: boolean;
  is_documentation: boolean;
  created_by: string;
  created_at: string;
  tag_ids: string[];
  last_synced_at: string | null;
};

export type DocRoute = {
  id: string;
  resource_id: string;
  url: string;
  name: string;
  section: string;
  description: string | null;
  created_at: string;
  created_by: string;
};

export type ResourceUploadSourceStats = {
  total_referenced: number;
  created: number;
  existing: number;
};

export type ResourceUploadTagStats = {
  total_referenced: number;
  created: number;
  existing: number;
};

export type ResourceUploadSummary = {
  total_urls_found: number;
  added_count: number;
  already_exists_count: number;
  wrongly_encoded_count: number;
  sources: ResourceUploadSourceStats;
  tags: ResourceUploadTagStats;
  row_errors: string[];
};

export type DocRouteUploadSummary = {
  rows_processed: number;
  routes_added: number;
  routes_skipped_existing: number;
  sections_added: number;
  wrongly_encoded_count: number;
  row_errors: string[];
};

export type AuditAction = 'create' | 'edit' | 'delete';

export type AuditEntry = {
  id: string;
  resource_id: string;
  action: AuditAction;
  meta_json: Record<string, unknown>;
  created_by: string;
  created_at: string;
};

export type ResourcePayload = {
  title: string;
  url: string;
  description?: string | null;
  source_id: string;
  is_repository: boolean;
  is_documentation: boolean;
  tag_ids: string[];
  last_synced_at?: string | null;
};

export type RepositoryPayload = {
  title: string;
  url: string;
  description?: string | null;
  source_id: string;
  is_documentation: boolean;
  tag_ids: string[];
};

export type ResourceUpdatePayload = {
  title?: string;
  url?: string;
  description?: string | null;
  source_id?: string;
  is_documentation?: boolean;
  tag_ids?: string[];
  last_synced_at?: string | null;
};

export type DocRoutePayload = {
  resource_id: string;
  url: string;
  name: string;
  section: string;
  description?: string | null;
};

export type DocRouteUpdatePayload = {
  url?: string;
  name?: string;
  section?: string;
  description?: string | null;
};

export type CreateAdminPayload = {
  email: string;
  is_superuser: boolean;
};

export type UpdateAdminPayload = {
  email?: string;
  is_active?: boolean;
};
