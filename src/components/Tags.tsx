import { FormEvent, useMemo, useState } from 'react';
import { AlertTriangle, MoreVertical, Plus, Tags as TagsIcon, Trash2 } from 'lucide-react';

import { AdminUser, Resource, Tag } from '../lib/types';
import {
  canManageRecord,
  formatDateTime,
  getErrorMessage,
  initialsFromEmail,
} from '../lib/utils';
import { ConfirmDialog, Modal } from './shared/Modal';
import { EmptyState, InlineAlert, LoadingState } from './shared/States';

type TagsProps = {
  tags: Tag[];
  resources: Resource[];
  admins: AdminUser[];
  currentAdmin: AdminUser;
  loading?: boolean;
  submitting?: boolean;
  onCreateTag: (title: string) => Promise<void>;
  onUpdateTag: (tagId: string, title: string) => Promise<void>;
  onDeleteTag: (tag: Tag) => Promise<void>;
};

export function Tags({
  tags,
  resources,
  admins,
  currentAdmin,
  loading = false,
  submitting = false,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: TagsProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const usageCounts = useMemo(
    () => Object.fromEntries(tags.map((tag) => [tag.id, resources.filter((resource) => resource.tag_ids.includes(tag.id)).length])),
    [resources, tags],
  );
  const adminNames = useMemo(
    () => Object.fromEntries(admins.map((admin) => [admin.id, admin.name])),
    [admins],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (editingTag) {
        await onUpdateTag(editingTag.id, title.trim());
        setEditingTag(null);
      } else {
        await onCreateTag(title.trim());
        setCreateOpen(false);
      }
      setTitle('');
      setFormError(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  if (loading) {
    return <LoadingState title="Loading tags..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-tertiary-fixed/20 border-l-4 border-tertiary px-5 py-4 rounded-r-xl flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-on-tertiary-fixed-variant">System Dependency Note</p>
          <p className="text-xs text-on-tertiary-fixed-variant/80 mt-0.5">
            Renaming or deleting a tag affects every resource currently classified with it. Review taxonomy dependencies before making broad changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
              Active Tags
            </p>
            <p className="text-xl font-black text-on-surface mt-0.5">{tags.length}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
              Deleted Tags
            </p>
            <p className="text-xl font-black text-on-surface mt-0.5">0</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
              Created By You
            </p>
            <p className="text-xl font-black text-on-surface mt-0.5">
              {tags.filter((tag) => tag.created_by === currentAdmin.id).length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-on-surface">Tags</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Create and manage taxonomy labels used to organize resources across the curation engine.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTitle('');
            setCreateOpen(true);
          }}
          className="self-start sm:self-auto bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Tag
        </button>
      </div>

      {tags.length === 0 ? (
        <EmptyState
          title="No tags yet"
          description="Create tags to classify resources and repositories across the admin workspace."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">
                    Title
                  </th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">
                    Created By
                  </th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">
                    Created On
                  </th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">
                    Tagged Resources
                  </th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {tags.map((tag) => {
                  const editable = canManageRecord(tag.created_by, currentAdmin);
                  const ownerName = adminNames[tag.created_by] ?? tag.created_by;

                  return (
                    <tr
                      key={tag.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/12 text-primary flex items-center justify-center shrink-0">
                            <TagsIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-on-surface leading-tight">
                              {tag.title}
                            </p>
                            <p className="text-[10px] text-on-surface-variant truncate mt-1">
                              Taxonomy classification label
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[10px] font-bold">
                            {initialsFromEmail(ownerName)}
                          </div>
                          <span className="text-xs text-on-surface-variant">
                            {ownerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        {formatDateTime(tag.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center min-w-10 px-3 py-1 rounded-lg bg-primary/8 text-primary text-sm font-bold">
                          {usageCounts[tag.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {!editable ? (
                            <span className="text-[10px] font-bold text-outline">
                              Read only
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTag(tag);
                              setTitle(tag.title);
                            }}
                            className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
                            disabled={!editable}
                            aria-label={`Edit ${tag.title}`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-outline-variant/10">
            {tags.map((tag) => {
              const editable = canManageRecord(tag.created_by, currentAdmin);
              const ownerName = adminNames[tag.created_by] ?? tag.created_by;

              return (
                <div key={tag.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/12 text-primary flex items-center justify-center shrink-0">
                        <TagsIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface leading-tight">
                          {tag.title}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-1 truncate">
                          {ownerName}
                        </p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap text-[10px] text-on-surface-variant">
                          <span>{formatDateTime(tag.created_at)}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span>{usageCounts[tag.id] ?? 0} tagged resources</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTag(tag);
                        setTitle(tag.title);
                      }}
                      className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
                      disabled={!editable}
                      aria-label={`Edit ${tag.title}`}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low/35 flex items-center justify-between">
            <span className="text-sm text-on-surface-variant">
              Showing 1 to {tags.length} of {tags.length} tags
            </span>
            <div className="hidden sm:flex items-center gap-2">
              <button
                className="w-9 h-9 rounded-lg border border-outline-variant/30 text-outline bg-white/80"
                disabled
              >
                &lt;
              </button>
              <button className="w-9 h-9 rounded-lg bg-primary text-white font-semibold">
                1
              </button>
              <button
                className="w-9 h-9 rounded-lg border border-outline-variant/30 text-on-surface bg-white/80"
                disabled
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={createOpen || Boolean(editingTag)}
        title={editingTag ? 'Edit Tag' : 'Create Tag'}
        description="Manage tag names from the backend and keep resource classification aligned."
        onClose={() => {
          setCreateOpen(false);
          setEditingTag(null);
          setTitle('');
          setFormError(null);
        }}
        maxWidthClassName="max-w-lg"
        footer={(
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <div>
              {editingTag ? (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(editingTag)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-error hover:bg-error/5 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Tag
                  </span>
                </button>
              ) : (
                <span />
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setEditingTag(null);
                  setTitle('');
                  setFormError(null);
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="tag-form"
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {submitting ? 'Saving...' : editingTag ? 'Save Changes' : 'Create Tag'}
              </button>
            </div>
          </div>
        )}
      >
        <form id="tag-form" className="space-y-4" onSubmit={handleSubmit}>
          <InlineAlert message={formError} tone="error" />
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Tag Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Tag"
        description={`Delete ${deleteTarget?.title ?? 'this tag'} from the backend. Existing resource tag links will be affected.`}
        confirmLabel="Delete Tag"
        isPending={submitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void onDeleteTag(deleteTarget).then(() => setDeleteTarget(null));
          }
        }}
      />
    </div>
  );
}
