import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Database,
  Edit2,
  ExternalLink,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { AdminUser, Repository, RepositoryPayload, Source, Tag } from '../lib/types';
import { useClientListPagination } from '../lib/useClientListPagination';
import {
  formatRelativeTime,
  getErrorMessage,
} from '../lib/utils';
import { ConfirmDialog, Modal } from './shared/Modal';
import { ListPaginationFooter } from './shared/ListPaginationFooter';
import { TagMultiSelect } from './shared/TagMultiSelect';
import { EmptyState, InlineAlert, LoadingState } from './shared/States';

type RepositoriesProps = {
  repositories: Repository[];
  sources: Source[];
  tags: Tag[];
  currentAdmin: AdminUser;
  loading?: boolean;
  submitting?: boolean;
  onViewDetail: (repository: Repository) => void;
  onCreateRepository: (payload: RepositoryPayload) => Promise<void>;
  onUpdateRepository: (repositoryId: string, payload: RepositoryPayload) => Promise<void>;
  onDeleteRepository: (repository: Repository) => Promise<void>;
};

type RepositoryFormValues = {
  title: string;
  url: string;
  description: string;
  source_id: string;
  tag_ids: string[];
  is_documentation: boolean;
};

function buildInitialValues(repository?: Repository | null): RepositoryFormValues {
  return {
    title: repository?.title ?? '',
    url: repository?.url ?? '',
    description: repository?.description ?? '',
    source_id: repository?.source_id ?? '',
    tag_ids: repository?.tag_ids ?? [],
    is_documentation: repository?.is_documentation ?? false,
  };
}

function TagPill({ tag }: { tag: Tag | undefined }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-secondary-container/50 text-on-secondary-container">
      {tag?.title ?? 'Unknown'}
    </span>
  );
}

export function Repositories({
  repositories,
  sources,
  tags,
  currentAdmin,
  loading = false,
  submitting = false,
  onViewDetail,
  onCreateRepository,
  onUpdateRepository,
  onDeleteRepository,
}: RepositoriesProps) {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRepository, setEditingRepository] = useState<Repository | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Repository | null>(null);
  const [values, setValues] = useState<RepositoryFormValues>(buildInitialValues());
  const [formError, setFormError] = useState<string | null>(null);

  const sourceMap = useMemo(
    () => Object.fromEntries(sources.map((source) => [source.id, source])),
    [sources],
  );
  const tagMap = useMemo(
    () => Object.fromEntries(tags.map((tag) => [tag.id, tag])),
    [tags],
  );

  const filtered = activeSource
    ? repositories.filter((repository) => repository.source_id === activeSource)
    : repositories;

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    safePage,
    totalPages,
    sliceStart,
    rangeEnd,
    sliceItems,
    totalItems: filteredTotal,
  } = useClientListPagination(filtered.length);

  const paginatedFiltered = sliceItems(filtered);

  useEffect(() => {
    setPage(1);
  }, [activeSource, setPage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const payload: RepositoryPayload = {
        title: values.title.trim(),
        url: values.url.trim(),
        description: values.description.trim() || null,
        source_id: values.source_id,
        is_documentation: values.is_documentation,
        tag_ids: values.tag_ids,
      };

      if (editingRepository) {
        await onUpdateRepository(editingRepository.id, payload);
        setEditingRepository(null);
      } else {
        await onCreateRepository(payload);
        setCreateOpen(false);
      }

      setValues(buildInitialValues());
      setFormError(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  if (loading) {
    return <LoadingState title="Loading repositories..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-on-surface">Repositories</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {repositories.length}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">Repository-backed resources synced directly with the backend.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setValues(buildInitialValues());
            setCreateOpen(true);
          }}
          className="self-start sm:self-auto bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Connect Repository
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Total</p>
          <p className="text-2xl font-black text-on-surface mt-1">{repositories.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Created by you</p>
          <p className="text-2xl font-black text-on-surface mt-1">
            {repositories.filter((r) => r.created_by === currentAdmin.id).length}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Filtered Results</p>
          <p className="text-2xl font-black text-on-surface mt-1">{filtered.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-outline px-1">Source:</span>
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

      {filtered.length === 0 ? (
        <EmptyState
          title="No repositories found"
          description="Adjust the source filter or connect a new repository."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant/30">
                  <tr>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Title</th>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Source</th>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Tags</th>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Last Synced</th>
                    <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {paginatedFiltered.map((repository) => {
                    const locked = false;
                    const linkedTags = repository.tag_ids.slice(0, 3).map((tagId) => tagMap[tagId]);
                    const overflow = Math.max(repository.tag_ids.length - linkedTags.length, 0);

                    return (
                      <tr key={repository.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${locked ? 'bg-surface-container-high text-outline' : 'bg-primary/10 text-primary'}`}>
                              <Database className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => onViewDetail(repository)}
                                className="text-sm font-bold text-on-surface hover:text-primary transition-colors text-left"
                              >
                                {repository.title}
                              </button>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-on-surface-variant">
                                <span className="px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-primary/10 text-primary">
                                  Repository
                                </span>
                                {repository.is_documentation ? (
                                  <span className="px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container">
                                    Docs
                                  </span>
                                ) : null}
                                <a
                                  href={repository.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 hover:text-primary max-w-[240px]"
                                >
                                  <span className="truncate">{repository.url}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          {sourceMap[repository.source_id]?.title ?? 'Unknown source'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {linkedTags.map((tag) => <TagPill key={tag?.id ?? 'missing'} tag={tag} />)}
                            {overflow > 0 ? <span className="text-[10px] font-bold text-outline">+{overflow}</span> : null}
                            {repository.tag_ids.length === 0 ? <span className="text-xs text-on-surface-variant">No tags</span> : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{repository.last_synced_at ? formatRelativeTime(repository.last_synced_at) : 'Not synced'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onViewDetail(repository)}
                              className="px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-primary/90 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => {
                                setEditingRepository(repository);
                                setValues(buildInitialValues(repository));
                              }}
                              disabled={locked}
                              className="px-2 py-1.5 border border-outline-variant text-on-surface-variant rounded text-xs font-bold hover:bg-surface-variant transition-colors disabled:opacity-50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(repository)}
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

          <div className="md:hidden space-y-3 p-3 sm:p-4 bg-surface-container-low/20">
            {paginatedFiltered.map((repository) => {
              const locked = false;
              const linkedTags = repository.tag_ids.slice(0, 2).map((tagId) => tagMap[tagId]);

              return (
                <div key={repository.id} className="bg-white rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                        <Database className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-on-surface leading-tight">{repository.title}</p>
                        <p className="text-[10px] text-outline font-mono mt-1 truncate">{repository.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary">
                        Repository
                      </span>
                      {repository.is_documentation ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container">
                          Docs
                        </span>
                      ) : null}
                      {linkedTags.map((tag) => <TagPill key={tag?.id ?? 'missing'} tag={tag} />)}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                      <div className="flex items-center gap-2 text-[10px] text-outline font-medium min-w-0">
                        <RefreshCw className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{repository.last_synced_at ? formatRelativeTime(repository.last_synced_at) : 'Not synced'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingRepository(repository);
                            setValues(buildInitialValues(repository));
                          }}
                          disabled={locked}
                          className="px-2 py-1 border border-outline-variant text-on-surface-variant rounded text-xs font-bold disabled:opacity-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onViewDetail(repository)}
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
          </div>

          <ListPaginationFooter
            entityLabel="repositories"
            totalItems={filteredTotal}
            sliceStart={sliceStart}
            rangeEnd={rangeEnd}
            page={page}
            safePage={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <Modal
        open={createOpen || Boolean(editingRepository)}
        title={editingRepository ? 'Edit Repository' : 'Connect Repository'}
        description="Repository edits update only the resource metadata. Sync timestamps are managed by background workers."
        onClose={() => {
          setCreateOpen(false);
          setEditingRepository(null);
          setValues(buildInitialValues());
          setFormError(null);
        }}
        footer={(
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setEditingRepository(null);
                setValues(buildInitialValues());
                setFormError(null);
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="repository-form"
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {submitting ? 'Saving...' : editingRepository ? 'Save Changes' : 'Connect Repository'}
            </button>
          </div>
        )}
      >
        <form id="repository-form" className="space-y-4" onSubmit={handleSubmit}>
          <InlineAlert message={formError} tone="error" />

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Title</label>
            <input
              value={values.title}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Repository URL</label>
            <input
              value={values.url}
              onChange={(event) => setValues((current) => ({ ...current, url: event.target.value }))}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Description</label>
            <textarea
              rows={4}
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Source</label>
            <select
              value={values.source_id}
              onChange={(event) => setValues((current) => ({ ...current, source_id: event.target.value }))}
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

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline" htmlFor="repository-form-tags-search">
              Tags
            </label>
            <TagMultiSelect
              key={editingRepository?.id ?? 'repository-form-new'}
              id="repository-form-tags-search"
              tags={tags}
              selectedIds={values.tag_ids}
              onChange={(tag_ids) => setValues((current) => ({ ...current, tag_ids }))}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={values.is_documentation}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  is_documentation: event.target.checked,
                }))}
            />
            <span>Treat this repository as documentation and enable docs subsections</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Repository"
        description={`Delete ${deleteTarget?.title ?? 'this repository'} and its backing resource metadata.`}
        confirmLabel="Delete Repository"
        isPending={submitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void onDeleteRepository(deleteTarget).then(() => setDeleteTarget(null));
          }
        }}
      />
    </div>
  );
}
