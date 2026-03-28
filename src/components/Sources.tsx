import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Database,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";

import { AdminUser, Resource, Source } from "../lib/types";
import {
  canManageRecord,
  formatDateTime,
  getErrorMessage,
  initialsFromEmail,
} from "../lib/utils";
import { ConfirmDialog, Modal } from "./shared/Modal";
import { EmptyState, InlineAlert, LoadingState } from "./shared/States";

type SourcesProps = {
  sources: Source[];
  resources: Resource[];
  admins: AdminUser[];
  currentAdmin: AdminUser;
  loading?: boolean;
  submitting?: boolean;
  onCreateSource: (title: string) => Promise<void>;
  onUpdateSource: (sourceId: string, title: string) => Promise<void>;
  onDeleteSource: (source: Source) => Promise<void>;
};

export function Sources({
  sources,
  resources,
  admins,
  currentAdmin,
  loading = false,
  submitting = false,
  onCreateSource,
  onUpdateSource,
  onDeleteSource,
}: SourcesProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Source | null>(null);
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resourceCounts = useMemo(
    () =>
      Object.fromEntries(
        sources.map((source) => [
          source.id,
          resources.filter((resource) => resource.source_id === source.id)
            .length,
        ]),
      ),
    [resources, sources],
  );
  const adminNames = useMemo(
    () => Object.fromEntries(admins.map((admin) => [admin.id, admin.name])),
    [admins],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (editingSource) {
        await onUpdateSource(editingSource.id, title.trim());
        setEditingSource(null);
      } else {
        await onCreateSource(title.trim());
        setCreateOpen(false);
      }
      setTitle("");
      setFormError(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  if (loading) {
    return <LoadingState title="Loading sources..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-tertiary-fixed/20 border-l-4 border-tertiary px-5 py-4 rounded-r-xl flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-on-tertiary-fixed-variant">
            System Dependency Note
          </p>
          <p className="text-xs text-on-tertiary-fixed-variant/80 mt-0.5">
            Cascading deletion can impact linked resources and downstream
            ingestion jobs. Review dependencies before editing core connectors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
              Active Sources
            </p>
            <p className="text-xl font-black text-on-surface mt-0.5">
              {sources.length}
            </p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
              Deleted Sources
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
              {
                sources.filter((source) => source.created_by === currentAdmin.id)
                  .length
              }
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-on-surface">
            Sources
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Configure and manage upstream data connections for the curation
            engine.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setCreateOpen(true);
          }}
          className="self-start sm:self-auto bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Source
        </button>
      </div>

      {sources.length === 0 ? (
        <EmptyState
          title="No sources available"
          description="Create the first source to start attaching resources and repositories."
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
                    Attached Resources
                  </th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {sources.map((source) => {
                  const editable = canManageRecord(
                    source.created_by,
                    currentAdmin,
                  );
                  const ownerName =
                    adminNames[source.created_by] ?? source.created_by;

                  return (
                    <tr
                      key={source.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/12 text-primary flex items-center justify-center shrink-0">
                            <Database className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-on-surface leading-tight">
                              {source.title}
                            </p>
                            <p className="text-[10px] text-on-surface-variant truncate mt-1">
                              Connected source definition
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
                        {formatDateTime(source.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center min-w-10 px-3 py-1 rounded-lg bg-primary/8 text-primary text-sm font-bold">
                          {resourceCounts[source.id] ?? 0}
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
                              setEditingSource(source);
                              setTitle(source.title);
                            }}
                            className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
                            disabled={!editable}
                            aria-label={`Edit ${source.title}`}
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
            {sources.map((source) => {
              const editable = canManageRecord(source.created_by, currentAdmin);
              const ownerName =
                adminNames[source.created_by] ?? source.created_by;

              return (
                <div key={source.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/12 text-primary flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface leading-tight">
                          {source.title}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-1 truncate">
                          {ownerName}
                        </p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap text-[10px] text-on-surface-variant">
                          <span>{formatDateTime(source.created_at)}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span>
                            {resourceCounts[source.id] ?? 0} attached resources
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSource(source);
                        setTitle(source.title);
                      }}
                      className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
                      disabled={!editable}
                      aria-label={`Edit ${source.title}`}
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
              Showing 1 to {sources.length} of {sources.length} sources
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
        open={createOpen || Boolean(editingSource)}
        title={editingSource ? "Edit Source" : "Create Source"}
        description="Keep source names aligned with the backend records used by resources and repositories."
        onClose={() => {
          setCreateOpen(false);
          setEditingSource(null);
          setTitle("");
          setFormError(null);
        }}
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <div>
              {editingSource ? (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(editingSource)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-error hover:bg-error/5 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Source
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
                  setEditingSource(null);
                  setTitle("");
                  setFormError(null);
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="source-form"
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {submitting
                  ? "Saving..."
                  : editingSource
                    ? "Save Changes"
                    : "Create Source"}
              </button>
            </div>
          </div>
        }
      >
        <form id="source-form" className="space-y-4" onSubmit={handleSubmit}>
          <InlineAlert message={formError} tone="error" />
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Source Title
            </label>
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
        title="Delete Source"
        description={`Delete ${deleteTarget?.title ?? "this source"} from the backend. Linked resources may fail until reassigned.`}
        confirmLabel="Delete Source"
        isPending={submitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void onDeleteSource(deleteTarget).then(() => setDeleteTarget(null));
          }
        }}
      />
    </div>
  );
}
