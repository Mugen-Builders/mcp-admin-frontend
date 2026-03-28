import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Database,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  AdminUser,
  Resource,
  ResourcePayload,
  ResourceUpdatePayload,
  Source,
  Tag,
} from '../lib/types';
import {
  canManageRecord,
  formatRelativeTime,
  fromDateTimeInputValue,
  getErrorMessage,
  toDateTimeInputValue,
} from '../lib/utils';
import { ConfirmDialog, Modal } from './shared/Modal';
import { EmptyState, InlineAlert, LoadingState } from './shared/States';

type TabFilter = 'all' | 'repositories' | 'links';

type DashboardProps = {
  resources: Resource[];
  sources: Source[];
  tags: Tag[];
  currentAdmin: AdminUser;
  loading?: boolean;
  submitting?: boolean;
  onViewDetail: (resource: Resource) => void;
  onCreateResource: (payload: ResourcePayload) => Promise<void>;
  onUpdateResource: (resourceId: string, payload: ResourceUpdatePayload) => Promise<void>;
  onDeleteResource: (resource: Resource) => Promise<void>;
};

type ResourceFormValues = {
  title: string;
  url: string;
  description: string;
  source_id: string;
  tag_ids: string[];
  is_repository: boolean;
  is_documentation: boolean;
  last_synced_at: string;
};

function buildInitialValues(resource?: Resource): ResourceFormValues {
  return {
    title: resource?.title ?? '',
    url: resource?.url ?? '',
    description: resource?.description ?? '',
    source_id: resource?.source_id ?? '',
    tag_ids: resource?.tag_ids ?? [],
    is_repository: resource?.is_repository ?? false,
    is_documentation: resource?.is_documentation ?? false,
    last_synced_at: toDateTimeInputValue(resource?.last_synced_at ?? null),
  };
}

function TagPill({ tag }: { tag: Tag | undefined }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-secondary-container/50 text-on-secondary-container">
      {tag?.title ?? 'Unknown'}
    </span>
  );
}

function ResourceIcon({ resource, locked }: { resource: Resource; locked: boolean }) {
  if (locked) {
    return <Lock className="w-5 h-5 text-outline shrink-0" />;
  }

  if (resource.is_repository) {
    return <Database className="w-5 h-5 text-primary shrink-0" />;
  }

  return <FileText className="w-5 h-5 text-primary shrink-0" />;
}

type ResourceFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  resource?: Resource | null;
  sources: Source[];
  tags: Tag[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ResourceFormValues) => Promise<void>;
};

function ResourceFormModal({
  open,
  mode,
  resource,
  sources,
  tags,
  isSubmitting,
  onClose,
  onSubmit,
}: ResourceFormModalProps) {
  const [values, setValues] = useState<ResourceFormValues>(buildInitialValues(resource ?? undefined));
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (open) {
      setValues(buildInitialValues(resource ?? undefined));
      setFormError(null);
    }
  }, [open, resource]);

  function resetForm() {
    setValues(buildInitialValues(resource ?? undefined));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.source_id) {
      setFormError('Select a source before saving this resource.');
      return;
    }

    try {
      await onSubmit(values);
      resetForm();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Resource' : 'Create Resource'}
      description={isEdit ? 'Update the selected resource and keep its backend metadata in sync.' : 'Create a new resource or repository entry in the admin backend.'}
      onClose={() => {
        resetForm();
        onClose();
      }}
      footer={(
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="resource-form"
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Resource'}
          </button>
        </div>
      )}
    >
      <form
        id="resource-form"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <InlineAlert message={formError} tone="error" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Title</label>
            <input
              value={values.title}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">URL</label>
            <input
              value={values.url}
              onChange={(event) => setValues((current) => ({ ...current, url: event.target.value }))}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Description</label>
            <textarea
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Source</label>
            <select
              value={values.source_id}
              onChange={(event) => setValues((current) => ({ ...current, source_id: event.target.value }))}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            >
              <option value="">Select a source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title}
                </option>
              ))}
            </select>
          </div>

          {isEdit ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Last Synced</label>
              <input
                type="datetime-local"
                value={values.last_synced_at}
                onChange={(event) => setValues((current) => ({ ...current, last_synced_at: event.target.value }))}
                disabled={!values.is_repository}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm disabled:opacity-50"
              />
            </div>
          ) : null}

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Tags</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={values.tag_ids.includes(tag.id)}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        tag_ids: event.target.checked
                          ? [...current.tag_ids, tag.id]
                          : current.tag_ids.filter((tagId) => tagId !== tag.id),
                      }))
                    }
                  />
                  <span>{tag.title}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="md:col-span-2 flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={values.is_repository}
              disabled={isEdit}
              onChange={(event) => setValues((current) => ({ ...current, is_repository: event.target.checked }))}
            />
            <span>Store this entry as a repository-backed resource</span>
          </label>

          <label className="md:col-span-2 flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={values.is_documentation}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  is_documentation: event.target.checked,
                }))}
            />
            <span>Treat this resource as documentation and enable docs subsections</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export function Dashboard({
  resources,
  sources,
  tags,
  currentAdmin,
  loading = false,
  submitting = false,
  onViewDetail,
  onCreateResource,
  onUpdateResource,
  onDeleteResource,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const sourceMap = useMemo(
    () => Object.fromEntries(sources.map((source) => [source.id, source])),
    [sources],
  );
  const tagMap = useMemo(
    () => Object.fromEntries(tags.map((tag) => [tag.id, tag])),
    [tags],
  );

  const filtered = resources.filter((resource) => {
    if (activeTab === 'repositories' && !resource.is_repository) {
      return false;
    }

    if (activeTab === 'links' && resource.is_repository) {
      return false;
    }

    if (activeSource && resource.source_id !== activeSource) {
      return false;
    }

    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const haystack = `${resource.title} ${resource.url} ${resource.description ?? ''}`.toLowerCase();
    return haystack.includes(query);
  });

  async function handleCreate(values: ResourceFormValues) {
    await onCreateResource({
      title: values.title.trim(),
      url: values.url.trim(),
      description: values.description.trim() || null,
      source_id: values.source_id,
      is_repository: values.is_repository,
      is_documentation: values.is_documentation,
      tag_ids: values.tag_ids,
    });
    setCreateOpen(false);
  }

  async function handleEdit(values: ResourceFormValues) {
    if (!editingResource) {
      return;
    }

    await onUpdateResource(editingResource.id, {
      title: values.title.trim(),
      url: values.url.trim(),
      description: values.description.trim() || null,
      source_id: values.source_id,
      is_documentation: values.is_documentation,
      tag_ids: values.tag_ids,
      last_synced_at: editingResource.is_repository ? fromDateTimeInputValue(values.last_synced_at) : undefined,
    });
    setEditingResource(null);
  }

  if (loading) {
    return <LoadingState title="Loading resources..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-on-surface">Resources</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Manage documents, connectors, and repository-backed entries from the admin API.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="self-start sm:self-auto bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Resource
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Total</p>
          <p className="text-2xl font-black text-on-surface mt-1">{resources.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Repositories</p>
          <p className="text-2xl font-black text-on-surface mt-1">{resources.filter((item) => item.is_repository).length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Editable By You</p>
          <p className="text-2xl font-black text-on-surface mt-1">{resources.filter((item) => canManageRecord(item.created_by, currentAdmin)).length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-fit border border-outline-variant/20 overflow-x-auto no-scrollbar">
            {([
              { key: 'all', label: 'All Resources' },
              { key: 'repositories', label: 'Repositories Only' },
              { key: 'links', label: 'Links Only' },
            ] as { key: TabFilter; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === key
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-on-surface-variant hover:bg-surface-variant/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resources..."
            className="w-full lg:max-w-sm rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-outline px-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Source
          </span>
          {sources.map((source) => (
            <button
              key={source.id}
              onClick={() => setActiveSource((current) => (current === source.id ? null : source.id))}
              className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                activeSource === source.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline-variant bg-white text-on-surface hover:border-primary'
              }`}
            >
              {source.title}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="Try another filter, or create the first resource from this dashboard."
          action={(
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-semibold"
            >
              Create Resource
            </button>
          )}
        />
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant/30">
                  <tr>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Title</th>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Source</th>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Tags</th>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Created</th>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filtered.map((resource) => {
                    const locked = !canManageRecord(resource.created_by, currentAdmin);
                    const linkedTags = resource.tag_ids.slice(0, 3).map((tagId) => tagMap[tagId]);
                    const overflow = Math.max(resource.tag_ids.length - linkedTags.length, 0);

                    return (
                      <tr key={resource.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <ResourceIcon resource={resource} locked={locked} />
                            <div className="min-w-0">
                              <button
                                onClick={() => onViewDetail(resource)}
                                className="text-sm font-bold text-on-surface hover:text-primary transition-colors text-left"
                              >
                                {resource.title}
                              </button>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-on-surface-variant">
                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${resource.is_repository ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                                  {resource.is_repository ? 'Repository' : 'Link'}
                                </span>
                                {resource.is_documentation ? (
                                  <span className="px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container">
                                    Docs
                                  </span>
                                ) : null}
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 hover:text-primary max-w-[240px]"
                                >
                                  <span className="truncate">{resource.url}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          {sourceMap[resource.source_id]?.title ?? 'Unknown source'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {linkedTags.map((tag) => <TagPill key={tag?.id ?? 'missing'} tag={tag} />)}
                            {overflow > 0 ? <span className="text-[10px] font-bold text-outline">+{overflow}</span> : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          {formatRelativeTime(resource.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onViewDetail(resource)}
                              className="px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-primary/90 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => setEditingResource(resource)}
                              disabled={locked}
                              className="px-2 py-1.5 border border-outline-variant text-on-surface-variant rounded text-xs font-bold hover:bg-surface-variant transition-colors disabled:opacity-50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(resource)}
                              disabled={locked}
                              className="px-2 py-1.5 border border-outline-variant text-error rounded text-xs font-bold hover:bg-error/5 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((resource) => {
              const locked = !canManageRecord(resource.created_by, currentAdmin);
              const linkedTags = resource.tag_ids.slice(0, 2).map((tagId) => tagMap[tagId]);

              return (
                <div key={resource.id} className="bg-white rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <ResourceIcon resource={resource} locked={locked} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-on-surface leading-tight">{resource.title}</p>
                        <p className="text-[10px] text-outline font-mono mt-1 truncate">{resource.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${resource.is_repository ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {resource.is_repository ? 'Repository' : 'Link'}
                      </span>
                      {resource.is_documentation ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container">
                          Docs
                        </span>
                      ) : null}
                      {linkedTags.map((tag) => <TagPill key={tag?.id ?? 'missing'} tag={tag} />)}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                      <span className="text-[10px] text-outline font-medium">{formatRelativeTime(resource.created_at)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingResource(resource)}
                          disabled={locked}
                          className="px-2 py-1 border border-outline-variant text-on-surface-variant rounded text-xs font-bold disabled:opacity-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onViewDetail(resource)}
                          className="px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-transform z-40"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        </>
      )}

      <ResourceFormModal
        open={createOpen}
        mode="create"
        sources={sources}
        tags={tags}
        isSubmitting={submitting}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ResourceFormModal
        open={Boolean(editingResource)}
        mode="edit"
        resource={editingResource}
        sources={sources}
        tags={tags}
        isSubmitting={submitting}
        onClose={() => setEditingResource(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Resource"
        description={`This will permanently remove ${deleteTarget?.title ?? 'this resource'} and its related data.`}
        confirmLabel="Delete Resource"
        isPending={submitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void onDeleteResource(deleteTarget).then(() => setDeleteTarget(null));
          }
        }}
      />
    </div>
  );
}
