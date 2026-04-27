import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Edit2, ExternalLink, Eye, Plus, Sparkles, Trash2 } from 'lucide-react';

import { AdminUser, Skill, SkillPayload, Source, Tag } from '../lib/types';
import { useClientListPagination } from '../lib/useClientListPagination';
import { formatRelativeTime, getErrorMessage } from '../lib/utils';
import { ConfirmDialog, Modal } from './shared/Modal';
import { ListPaginationFooter } from './shared/ListPaginationFooter';
import { TagMultiSelect } from './shared/TagMultiSelect';
import { EmptyState, InlineAlert, LoadingState } from './shared/States';

type SkillsProps = {
  skills: Skill[];
  sources: Source[];
  tags: Tag[];
  currentAdmin: AdminUser;
  loading?: boolean;
  submitting?: boolean;
  onViewDetail: (skill: Skill) => void;
  onCreateSkill: (payload: SkillPayload) => Promise<void>;
  onUpdateSkill: (skillId: string, payload: SkillPayload) => Promise<void>;
  onDeleteSkill: (skill: Skill) => Promise<void>;
};

type SkillFormValues = {
  title: string;
  description: string;
  source_id: string;
  tag_ids: string[];
  body: string;
};

function buildInitialValues(skill?: Skill | null): SkillFormValues {
  return {
    title: skill?.title ?? '',
    description: skill?.description ?? '',
    source_id: skill?.source_id ?? '',
    tag_ids: skill?.tag_ids ?? [],
    body: skill?.body ?? '',
  };
}

function TagPill({ tag }: { tag: Tag | undefined }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-secondary-container/50 text-on-secondary-container">
      {tag?.title ?? 'Unknown'}
    </span>
  );
}

export function Skills({
  skills,
  sources,
  tags,
  currentAdmin,
  loading = false,
  submitting = false,
  onViewDetail,
  onCreateSkill,
  onUpdateSkill,
  onDeleteSkill,
}: SkillsProps) {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [values, setValues] = useState<SkillFormValues>(buildInitialValues());
  const [formError, setFormError] = useState<string | null>(null);

  const sourceMap = useMemo(() => Object.fromEntries(sources.map((source) => [source.id, source])), [sources]);
  const tagMap = useMemo(() => Object.fromEntries(tags.map((tag) => [tag.id, tag])), [tags]);
  const filtered = activeSource ? skills.filter((skill) => skill.source_id === activeSource) : skills;
  const { page, setPage, pageSize, setPageSize, safePage, totalPages, sliceStart, rangeEnd, sliceItems, totalItems: filteredTotal } =
    useClientListPagination(filtered.length);
  const paginatedFiltered = sliceItems(filtered);

  useEffect(() => {
    setPage(1);
  }, [activeSource, setPage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const normalizedUrl = editingSkill?.url ?? values.title.trim();
      const payload: SkillPayload = {
        title: values.title.trim(),
        url: normalizedUrl,
        description: values.description.trim() || null,
        source_id: values.source_id,
        is_documentation: false,
        tag_ids: values.tag_ids,
        body: values.body.trim(),
      };
      if (editingSkill) {
        await onUpdateSkill(editingSkill.id, payload);
        setEditingSkill(null);
      } else {
        await onCreateSkill(payload);
        setCreateOpen(false);
      }
      setValues(buildInitialValues());
      setFormError(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  if (loading) {
    return <LoadingState title="Loading skills..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-on-surface">Skills</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{skills.length}</span>
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">Prompt and workflow skills used by the admin ecosystem.</p>
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
          Create Skill
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Total</p>
          <p className="text-2xl font-black text-on-surface mt-1">{skills.length}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Created by you</p>
          <p className="text-2xl font-black text-on-surface mt-1">{skills.filter((skill) => skill.created_by === currentAdmin.id).length}</p>
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
              activeSource === source.id ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant bg-white text-on-surface hover:border-primary'
            }`}
          >
            {source.title}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No skills found" description="Adjust the source filter or create a new skill." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant/30">
                <tr>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Title</th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Source</th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Tags</th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold">Last Updated</th>
                  <th className="px-6 py-4 text-[11px] text-outline uppercase tracking-widest font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {paginatedFiltered.map((skill) => {
                  const linkedTags = skill.tag_ids.slice(0, 3).map((tagId) => tagMap[tagId]);
                  const overflow = Math.max(skill.tag_ids.length - linkedTags.length, 0);
                  return (
                    <tr key={skill.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <button onClick={() => onViewDetail(skill)} className="text-sm font-bold text-on-surface hover:text-primary transition-colors text-left">
                              {skill.title}
                            </button>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-on-surface-variant">
                              <span className="px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-primary/10 text-primary">Skill</span>
                              {skill.is_documentation ? (
                                <span className="px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container">Docs</span>
                              ) : null}
                              <a href={skill.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary max-w-[240px]">
                                <span className="truncate">{skill.url}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{sourceMap[skill.source_id]?.title ?? 'Unknown source'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {linkedTags.map((tag) => <TagPill key={tag?.id ?? 'missing'} tag={tag} />)}
                          {overflow > 0 ? <span className="text-[10px] font-bold text-outline">+{overflow}</span> : null}
                          {skill.tag_ids.length === 0 ? <span className="text-xs text-on-surface-variant">No tags</span> : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{formatRelativeTime(skill.last_updated_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onViewDetail(skill)} className="px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-primary/90 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button onClick={() => { setEditingSkill(skill); setValues(buildInitialValues(skill)); }} className="px-2 py-1.5 border border-outline-variant text-on-surface-variant rounded text-xs font-bold hover:bg-surface-variant transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(skill)} className="px-2 py-1.5 border border-outline-variant text-error rounded text-xs font-bold hover:bg-error/5 transition-colors">
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
            {paginatedFiltered.map((skill) => (
              <div key={skill.id} className="bg-white rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface leading-tight">{skill.title}</p>
                      <p className="text-[10px] text-outline font-mono mt-1 truncate">{skill.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary">Skill</span>
                    {skill.is_documentation ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container">Docs</span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                    <div className="text-[10px] text-outline font-medium">{formatRelativeTime(skill.last_updated_at)}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingSkill(skill); setValues(buildInitialValues(skill)); }} className="px-2 py-1 border border-outline-variant text-on-surface-variant rounded text-xs font-bold">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onViewDetail(skill)} className="px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-bold flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ListPaginationFooter
            entityLabel="skills"
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
        open={createOpen || Boolean(editingSkill)}
        title={editingSkill ? 'Edit Skill' : 'Create Skill'}
        description="Manage skill metadata and body content."
        onClose={() => {
          setCreateOpen(false);
          setEditingSkill(null);
          setValues(buildInitialValues());
          setFormError(null);
        }}
        footer={(
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={() => { setCreateOpen(false); setEditingSkill(null); setValues(buildInitialValues()); setFormError(null); }} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
              Cancel
            </button>
            <button type="submit" form="skill-form" disabled={submitting} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70">
              {submitting ? 'Saving...' : editingSkill ? 'Save Changes' : 'Create Skill'}
            </button>
          </div>
        )}
      >
        <form id="skill-form" className="space-y-4" onSubmit={handleSubmit}>
          <InlineAlert message={formError} tone="error" />
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Title</label>
            <input value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} required className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Description</label>
            <textarea rows={4} value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Source</label>
            <select value={values.source_id} onChange={(event) => setValues((current) => ({ ...current, source_id: event.target.value }))} className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm">
              <option value="">Select a source</option>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline" htmlFor="skill-form-tags-search">Tags</label>
            <TagMultiSelect key={editingSkill?.id ?? 'skill-form-new'} id="skill-form-tags-search" tags={tags} selectedIds={values.tag_ids} onChange={(tag_ids) => setValues((current) => ({ ...current, tag_ids }))} />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Body</label>
            <textarea rows={10} value={values.body} onChange={(event) => setValues((current) => ({ ...current, body: event.target.value }))} className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-y" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Skill"
        description={`Delete ${deleteTarget?.title ?? 'this skill'} and its backing resource metadata.`}
        confirmLabel="Delete Skill"
        isPending={submitting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void onDeleteSkill(deleteTarget).then(() => setDeleteTarget(null));
          }
        }}
      />
    </div>
  );
}
