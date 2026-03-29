import {
  AdminUser,
  AuditEntry,
  DocRoute,
  DocRoutePayload,
  DocRouteUpdatePayload,
  AuthVerifyResponse,
  CreateAdminPayload,
  Repository,
  RepositoryPayload,
  Resource,
  ResourcePayload,
  ResourceUploadSummary,
  ResourceUpdatePayload,
  Source,
  Tag,
  UpdateAdminPayload,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_ADMIN_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  const isFormDataBody = typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (!headers.has('Content-Type') && init.body && !isFormDataBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const detail =
      typeof data === 'object' && data && 'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : text || `Request failed with status ${response.status}.`;

    throw new ApiError(detail, response.status);
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function randomPassword(): string {
  return `OtpOnly-${crypto.randomUUID()}-Aa1!`;
}

export function requestOtp(email: string) {
  return request<{ detail: string }>('/api/v1/auth/login/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email: string, code: string) {
  return request<AuthVerifyResponse>('/api/v1/auth/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function listResources(token: string) {
  return request<Resource[]>('/api/v1/resources/?limit=1000', {}, token);
}

export function createResource(token: string, payload: ResourcePayload) {
  return request<Resource>('/api/v1/resources/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function updateResource(token: string, resourceId: string, payload: ResourceUpdatePayload) {
  return request<Resource>(`/api/v1/resources/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function uploadResourcesCsv(token: string, file: File) {
  const body = new FormData();
  body.append('file', file);

  return request<ResourceUploadSummary>('/api/v1/resources/upload', {
    method: 'POST',
    body,
  }, token);
}

export function deleteResource(token: string, resourceId: string) {
  return request<void>(`/api/v1/resources/${resourceId}`, { method: 'DELETE' }, token);
}

export function listRepositories(token: string) {
  return request<Repository[]>('/api/v1/repositories/?limit=1000', {}, token);
}

export function createRepository(token: string, payload: RepositoryPayload) {
  return request<Repository>('/api/v1/repositories/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function updateRepository(token: string, repositoryId: string, payload: RepositoryPayload) {
  return request<Repository>(`/api/v1/repositories/${repositoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function deleteRepository(token: string, repositoryId: string) {
  return request<void>(`/api/v1/repositories/${repositoryId}`, { method: 'DELETE' }, token);
}

export function listDocRoutes(token: string, resourceId: string) {
  const query = new URLSearchParams({ resource_id: resourceId });
  return request<DocRoute[]>(`/api/v1/doc-routes/?${query.toString()}`, {}, token);
}

export function createDocRoute(token: string, payload: DocRoutePayload) {
  return request<DocRoute>('/api/v1/doc-routes/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function updateDocRoute(token: string, docRouteId: string, payload: DocRouteUpdatePayload) {
  return request<DocRoute>(`/api/v1/doc-routes/${docRouteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function deleteDocRoute(token: string, docRouteId: string) {
  return request<void>(`/api/v1/doc-routes/${docRouteId}`, { method: 'DELETE' }, token);
}

export function listSources(token: string) {
  return request<Source[]>('/api/v1/sources/?limit=1000', {}, token);
}

export function createSource(token: string, payload: { title: string }) {
  return request<Source>('/api/v1/sources/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function updateSource(token: string, sourceId: string, payload: { title: string }) {
  return request<Source>(`/api/v1/sources/${sourceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function deleteSource(token: string, sourceId: string) {
  return request<void>(`/api/v1/sources/${sourceId}`, { method: 'DELETE' }, token);
}

export function listTags(token: string) {
  return request<Tag[]>('/api/v1/tags/?limit=1000', {}, token);
}

export function createTag(token: string, payload: { title: string }) {
  return request<Tag>('/api/v1/tags/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function updateTag(token: string, tagId: string, payload: { title: string }) {
  return request<Tag>(`/api/v1/tags/${tagId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function deleteTag(token: string, tagId: string) {
  return request<void>(`/api/v1/tags/${tagId}`, { method: 'DELETE' }, token);
}

export function listAdmins(token: string) {
  return request<AdminUser[]>('/api/v1/admin/?limit=1000', {}, token);
}

export function createAdmin(token: string, payload: CreateAdminPayload) {
  return request<AdminUser>('/api/v1/admin/', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: randomPassword(),
      is_active: true,
      is_superuser: payload.is_superuser,
      is_verified: false,
    }),
  }, token);
}

export function updateAdmin(token: string, adminId: string, payload: UpdateAdminPayload) {
  return request<AdminUser>(`/api/v1/admin/${adminId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export function deleteAdmin(token: string, adminId: string) {
  return request<void>(`/api/v1/admin/${adminId}`, { method: 'DELETE' }, token);
}

export function listAudits(token: string, resourceId: string) {
  const query = new URLSearchParams({ resource_id: resourceId });
  return request<AuditEntry[]>(`/api/v1/audits/?${query.toString()}`, {}, token);
}
