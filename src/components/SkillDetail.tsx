import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Edit2,
  ExternalLink,
  FileText,
  History,
  Shield,
  Sparkles,
} from "lucide-react";

import {
  AdminUser,
  AuditEntry,
  Skill,
  SkillPayload,
  Source,
  Tag,
} from "../lib/types";
import {
  formatAuditChange,
  formatDateTime,
  formatRelativeTime,
  getErrorMessage,
  initialsFromEmail,
} from "../lib/utils";
import { ConfirmDialog, Modal } from "./shared/Modal";
import { TagMultiSelect } from "./shared/TagMultiSelect";
import { EmptyState, InlineAlert, LoadingState } from "./shared/States";

type SkillDetailProps = {
  skill: Skill;
  audits: AuditEntry[];
  sources: Source[];
  tags: Tag[];
  admins: AdminUser[];
  currentAdmin: AdminUser;
  isSubmitting?: boolean;
  isLoadingAudits?: boolean;
  onBack: () => void;
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

function buildFormValues(skill: Skill): SkillFormValues {
  return {
    title: skill.title,
    description: skill.description ?? "",
    source_id: skill.source_id,
    tag_ids: skill.tag_ids,
    body: skill.body,
  };
}

export function SkillDetail({
  skill,
  audits,
  sources,
  tags,
  admins,
  currentAdmin,
  isSubmitting = false,
  isLoadingAudits = false,
  onBack,
  onUpdateSkill,
  onDeleteSkill,
}: SkillDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formValues, setFormValues] = useState<SkillFormValues>(
    buildFormValues(skill),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const source = sources.find((item) => item.id === skill.source_id);
  const linkedTags = tags.filter((tag) => skill.tag_ids.includes(tag.id));
  const adminNames = useMemo(
    () => Object.fromEntries(admins.map((admin) => [admin.id, admin.name])),
    [admins],
  );
  const creatorName = adminNames[skill.created_by] ?? skill.created_by;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onUpdateSkill(skill.id, {
        title: formValues.title.trim(),
        url: skill.url,
        description: formValues.description.trim() || null,
        source_id: formValues.source_id,
        tag_ids: formValues.tag_ids,
        body: formValues.body.trim(),
        is_documentation: false,
      });
      setFormError(null);
      setIsEditing(false);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-outline font-medium tracking-wide uppercase">
          <button
            onClick={onBack}
            className="hover:text-primary transition-colors"
          >
            Skills
          </button>
          <span>/</span>
          <span className="text-on-surface truncate max-w-[180px] md:max-w-none">
            {skill.title}
          </span>
        </div>
        <button
          onClick={onBack}
          className="hidden md:flex items-center gap-2 text-xs font-semibold text-primary hover:gap-3 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Skills</span>
        </button>
      </nav>

      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
              {skill.title}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
              Skill
            </span>
            {skill.is_documentation ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                Documentation
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={skill.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline truncate max-w-[320px]"
            >
              <span className="truncate">{skill.url}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(skill.url)}
              className="p-1 hover:bg-surface-container-high rounded transition-colors text-outline"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormValues(buildFormValues(skill));
            setIsEditing(true);
          }}
          disabled={!currentAdmin}
          className="w-full md:w-auto bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-60"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Skill</span>
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/10">
            <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resource Definition
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                <label className="text-xs font-bold text-on-surface-variant pt-1">
                  Title
                </label>
                <div className="md:col-span-3 text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded-lg font-medium">
                  {skill.title}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                <label className="text-xs font-bold text-on-surface-variant pt-1">
                  Description
                </label>
                <div className="md:col-span-3 text-sm text-on-surface-variant leading-relaxed">
                  {skill.description ||
                    "No description provided for this skill yet."}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                <label className="text-xs font-bold text-on-surface-variant pt-1">
                  Knowledge Source
                </label>
                <div className="md:col-span-3 inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-lg border border-outline-variant/20">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold">
                    {source?.title ?? "Unknown source"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                <label className="text-xs font-bold text-on-surface-variant pt-1">
                  Active Tags
                </label>
                <div className="md:col-span-3 flex flex-wrap gap-2">
                  {linkedTags.length > 0 ? (
                    linkedTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold"
                      >
                        {tag.title}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-on-surface-variant">
                      No tags linked.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/10">
            <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Skill Content
            </h3>
            <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-4 text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
              {skill.body || "No skill content provided yet."}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                <History className="w-5 h-5" />
                Audit Timeline
              </h3>
            </div>
            {isLoadingAudits ? (
              <LoadingState title="Loading audit events..." />
            ) : audits.length === 0 ? (
              <EmptyState
                title="No audit entries yet"
                description="Edits to this skill will appear here once the backend records them."
              />
            ) : (
              <div className="space-y-6">
                {audits.map((audit, index) => (
                  <div
                    key={audit.id}
                    className={`relative pl-8 border-l-2 border-surface-container-high ${index < audits.length - 1 ? "pb-6" : ""}`}
                  >
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-surface-container-lowest" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-on-surface uppercase">
                          {audit.action}
                        </span>
                        <span className="text-[10px] text-outline">•</span>
                        <span className="text-xs font-medium text-on-surface-variant">
                          {adminNames[audit.created_by] ?? audit.created_by}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-outline">
                        {formatDateTime(audit.created_at)}
                      </span>
                    </div>
                    <div className="bg-surface-container-low rounded-lg p-3 text-xs border border-outline-variant/10">
                      {formatAuditChange(audit.meta_json)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="bg-surface-container-low rounded-xl p-6 ring-1 ring-outline-variant/10">
            <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-6">
              System Metadata
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">
                  Created By
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {initialsFromEmail(creatorName)}
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {creatorName}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">
                  Created At
                </label>
                <span className="text-sm font-medium text-on-surface-variant">
                  {formatDateTime(skill.created_at)}
                </span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">
                  Last Updated
                </label>
                <span className="text-sm font-medium text-on-surface-variant">
                  {formatRelativeTime(skill.last_updated_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-primary-fixed">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
              Resource Health
            </h3>
            <p className="text-sm text-on-surface-variant">
              This skill record is connected to the live backend and reflects
              the latest admin mutations.
            </p>
          </div>
          <div className="bg-error-container/10 rounded-xl p-6 ring-1 ring-error/20">
            <h3 className="text-xs font-bold text-error uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              Deleting this skill will permanently remove it and its linked
              resource extension.
            </p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="w-full py-2.5 rounded-lg border border-error text-error text-xs font-bold uppercase tracking-widest hover:bg-error hover:text-white transition-all"
            >
              Delete Skill
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={isEditing}
        title="Edit Skill"
        description="Update skill metadata and body."
        onClose={() => setIsEditing(false)}
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="skill-detail-form"
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      >
        <form
          id="skill-detail-form"
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          <InlineAlert message={formError} tone="error" />
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Title
            </label>
            <input
              value={formValues.title}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Description
            </label>
            <textarea
              rows={4}
              value={formValues.description}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Source
            </label>
            <select
              value={formValues.source_id}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  source_id: event.target.value,
                }))
              }
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            >
              {sources.map((sourceOption) => (
                <option key={sourceOption.id} value={sourceOption.id}>
                  {sourceOption.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              className="text-[11px] font-bold uppercase tracking-wider text-outline"
              htmlFor="skill-detail-tags-search"
            >
              Tags
            </label>
            <TagMultiSelect
              key={skill.id}
              id="skill-detail-tags-search"
              tags={tags}
              selectedIds={formValues.tag_ids}
              onChange={(tag_ids) =>
                setFormValues((current) => ({ ...current, tag_ids }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Body
            </label>
            <textarea
              rows={10}
              value={formValues.body}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  body: event.target.value,
                }))
              }
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-y"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Skill"
        description={`This action cannot be undone. ${skill.title} will be removed permanently.`}
        confirmLabel="Delete Skill"
        isPending={isSubmitting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          void onDeleteSkill(skill).then(() => setDeleteOpen(false))
        }
      />
    </div>
  );
}
