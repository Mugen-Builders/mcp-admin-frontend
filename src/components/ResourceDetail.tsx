import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenText,
  Clock3,
  Copy,
  Edit2,
  Eye,
  ExternalLink,
  FileText,
  History,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
} from 'lucide-react';

import {
  AdminUser,
  ArticlePayload,
  AuditEntry,
  DocRoute,
  DocRoutePayload,
  DocRouteUpdatePayload,
  DocRouteUploadSummary,
  Resource,
  ResourceUpdatePayload,
  SkillPayload,
  Source,
  Tag,
} from '../lib/types';
import {
  formatAuditChange,
  formatDateTime,
  formatRelativeTime,
  getErrorMessage,
  initialsFromEmail,
} from '../lib/utils';
import { DocsViewerModal } from './DocsViewerModal';
import { ConfirmDialog, Modal } from './shared/Modal';
import { TagMultiSelect } from './shared/TagMultiSelect';
import { EmptyState, InlineAlert, LoadingState } from './shared/States';

type ResourceDetailProps = {
  resource: Resource;
  resourceExtendedContent?: { kind: 'article' | 'skill'; id: string; title: string; body: string; year_published?: number | null } | null;
  audits: AuditEntry[];
  docRoutes: DocRoute[];
  sources: Source[];
  tags: Tag[];
  admins: AdminUser[];
  currentAdmin: AdminUser;
  isSubmitting?: boolean;
  isLoadingAudits?: boolean;
  isLoadingDocRoutes?: boolean;
  onBack: () => void;
  onUpdateResource: (resourceId: string, payload: ResourceUpdatePayload) => Promise<void>;
  onUpdateArticleFromResource?: (articleId: string, payload: ArticlePayload) => Promise<void>;
  onUpdateSkillFromResource?: (skillId: string, payload: SkillPayload) => Promise<void>;
  onDeleteResource: (resource: Resource) => Promise<void>;
  onCreateDocRoute: (payload: DocRoutePayload) => Promise<void>;
  onUpdateDocRoute: (docRouteId: string, payload: DocRouteUpdatePayload) => Promise<void>;
  onDeleteDocRoute: (docRoute: DocRoute) => Promise<void>;
  onUploadDocRoutesCsv?: (file: File) => Promise<DocRouteUploadSummary>;
};

type DetailFormValues = {
  title: string;
  url: string;
  description: string;
  source_id: string;
  tag_ids: string[];
  is_documentation: boolean;
  body: string;
};

type DocRouteFormValues = {
  name: string;
  url: string;
  section: string;
  description: string;
};

function buildFormValues(resource: Resource, body?: string): DetailFormValues {
  return {
    title: resource.title,
    url: resource.url,
    description: resource.description ?? '',
    source_id: resource.source_id,
    tag_ids: resource.tag_ids,
    is_documentation: resource.is_documentation,
    body: body ?? '',
  };
}

function buildDocRouteFormValues(docRoute?: DocRoute | null): DocRouteFormValues {
  return {
    name: docRoute?.name ?? '',
    url: docRoute?.url ?? '',
    section: docRoute?.section ?? '',
    description: docRoute?.description ?? '',
  };
}

export function ResourceDetail({
  resource,
  resourceExtendedContent = null,
  audits,
  docRoutes,
  sources,
  tags,
  admins,
  currentAdmin,
  isSubmitting = false,
  isLoadingAudits = false,
  isLoadingDocRoutes = false,
  onBack,
  onUpdateResource,
  onUpdateArticleFromResource,
  onUpdateSkillFromResource,
  onDeleteResource,
  onCreateDocRoute,
  onUpdateDocRoute,
  onDeleteDocRoute,
  onUploadDocRoutesCsv,
}: ResourceDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState<DetailFormValues>(buildFormValues(resource, resourceExtendedContent?.body));
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [docsViewerOpen, setDocsViewerOpen] = useState(false);
  const [isDocRouteModalOpen, setIsDocRouteModalOpen] = useState(false);
  const [docRouteFormValues, setDocRouteFormValues] = useState<DocRouteFormValues>(
    buildDocRouteFormValues(),
  );
  const [docRouteFormError, setDocRouteFormError] = useState<string | null>(null);
  const [editingDocRoute, setEditingDocRoute] = useState<DocRoute | null>(null);
  const [deleteDocRouteTarget, setDeleteDocRouteTarget] = useState<DocRoute | null>(null);
  const [activeDocSectionIndex, setActiveDocSectionIndex] = useState(0);

  const editable = Boolean(currentAdmin);
  const isArticleResource = resourceExtendedContent?.kind === 'article';
  const isSkillResource = resourceExtendedContent?.kind === 'skill';
  const isExtendedResource = isArticleResource || isSkillResource;
  const source = sources.find((item) => item.id === resource.source_id);
  const linkedTags = tags.filter((tag) => resource.tag_ids.includes(tag.id));
  const adminNames = useMemo(
    () => Object.fromEntries(admins.map((admin) => [admin.id, admin.name])),
    [admins],
  );
  const creatorName = adminNames[resource.created_by] ?? resource.created_by;
  const groupedDocRoutes = useMemo(
    () =>
      Object.entries(
        docRoutes.reduce<Record<string, DocRoute[]>>((accumulator, docRoute) => {
          const key = docRoute.section || 'General';
          accumulator[key] = [...(accumulator[key] ?? []), docRoute];
          return accumulator;
        }, {}),
      ).sort(([left], [right]) => left.localeCompare(right)),
    [docRoutes],
  );

  const docSectionCount = groupedDocRoutes.length;

  useEffect(() => {
    setActiveDocSectionIndex((index) =>
      Math.min(Math.max(0, index), Math.max(0, docSectionCount - 1)),
    );
  }, [docSectionCount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (isArticleResource && resourceExtendedContent && onUpdateArticleFromResource) {
        await onUpdateArticleFromResource(resourceExtendedContent.id, {
          title: formValues.title.trim(),
          url: formValues.url.trim(),
          description: formValues.description.trim() || null,
          source_id: formValues.source_id,
          is_documentation: false,
          tag_ids: formValues.tag_ids,
          body: formValues.body.trim(),
          year_published: resourceExtendedContent.year_published ?? null,
        });
      } else if (isSkillResource && resourceExtendedContent && onUpdateSkillFromResource) {
        await onUpdateSkillFromResource(resourceExtendedContent.id, {
          title: formValues.title.trim(),
          url: formValues.url.trim(),
          description: formValues.description.trim() || null,
          source_id: formValues.source_id,
          is_documentation: false,
          tag_ids: formValues.tag_ids,
          body: formValues.body.trim(),
        });
      } else {
        await onUpdateResource(resource.id, {
          title: formValues.title.trim(),
          url: formValues.url.trim(),
          description: formValues.description.trim() || null,
          source_id: formValues.source_id,
          is_documentation: formValues.is_documentation,
          tag_ids: formValues.tag_ids,
        });
      }
      setFormError(null);
      setIsEditing(false);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  function openCreateDocRouteModal() {
    setEditingDocRoute(null);
    setDocRouteFormValues(buildDocRouteFormValues());
    setDocRouteFormError(null);
    setIsDocRouteModalOpen(true);
  }

  function openEditDocRouteModal(docRoute: DocRoute) {
    setEditingDocRoute(docRoute);
    setDocRouteFormValues(buildDocRouteFormValues(docRoute));
    setDocRouteFormError(null);
    setIsDocRouteModalOpen(true);
  }

  async function handleDocRouteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (editingDocRoute) {
        await onUpdateDocRoute(editingDocRoute.id, {
          name: docRouteFormValues.name.trim(),
          url: docRouteFormValues.url.trim(),
          section: docRouteFormValues.section.trim(),
          description: docRouteFormValues.description.trim() || null,
        });
      } else {
        await onCreateDocRoute({
          resource_id: resource.id,
          name: docRouteFormValues.name.trim(),
          url: docRouteFormValues.url.trim(),
          section: docRouteFormValues.section.trim(),
          description: docRouteFormValues.description.trim() || null,
        });
      }

      setDocRouteFormError(null);
      setEditingDocRoute(null);
      setIsDocRouteModalOpen(false);
      setDocRouteFormValues(buildDocRouteFormValues());
    } catch (error) {
      setDocRouteFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-outline font-medium tracking-wide uppercase">
          <button onClick={onBack} className="hover:text-primary transition-colors">Resources</button>
          <span>/</span>
          <span className="text-on-surface truncate max-w-[180px] md:max-w-none">{resource.title}</span>
        </div>
        <button onClick={onBack} className="hidden md:flex items-center gap-2 text-xs font-semibold text-primary hover:gap-3 transition-all">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resources</span>
        </button>
      </nav>

      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">{resource.title}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${resource.is_repository ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {resource.is_repository ? 'Managed Repository' : 'External Resource'}
            </span>
            {resource.is_documentation ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                Documentation
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline truncate max-w-[320px]"
            >
              <span className="truncate">{resource.url}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(resource.url)}
              className="p-1 hover:bg-surface-container-high rounded transition-colors text-outline"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            disabled={!editable}
            onClick={() => {
              setFormValues(buildFormValues(resource, resourceExtendedContent?.body));
              setIsEditing(true);
            }}
            className="w-full md:w-auto bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-60"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Resource</span>
          </button>
        </div>
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
                <label className="text-xs font-bold text-on-surface-variant pt-1">Title</label>
                <div className="md:col-span-3 text-sm text-on-surface bg-surface-container-low px-3 py-2 rounded-lg font-medium">{resource.title}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                <label className="text-xs font-bold text-on-surface-variant pt-1">Description</label>
                <div className="md:col-span-3 text-sm text-on-surface-variant leading-relaxed">
                  {resource.description || 'No description provided for this resource yet.'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                <label className="text-xs font-bold text-on-surface-variant pt-1">Knowledge Source</label>
                <div className="md:col-span-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-lg border border-outline-variant/20">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold">{source?.title ?? 'Unknown source'}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                <label className="text-xs font-bold text-on-surface-variant pt-1">Active Tags</label>
                <div className="md:col-span-3 flex flex-wrap gap-2">
                  {linkedTags.length > 0 ? linkedTags.map((tag) => (
                    <span key={tag.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold">
                      {tag.title}
                    </span>
                  )) : <span className="text-sm text-on-surface-variant">No tags linked.</span>}
                </div>
              </div>
            </div>
          </div>

          {resourceExtendedContent ? (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/10">
              <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {resourceExtendedContent.title}
              </h3>
              <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-4 text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                {resourceExtendedContent.body || 'No content available yet.'}
              </div>
            </div>
          ) : null}

          {resource.is_documentation ? (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xs font-bold text-outline uppercase tracking-widest flex items-center gap-2">
                    <BookOpenText className="w-5 h-5" />
                    Docs Subsections
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Organize subsection routes for this documentation resource.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={openCreateDocRouteModal}
                    disabled={!editable}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Plus className="w-4 h-4" />
                    New Doc Route
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocsViewerOpen(true)}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Documentation
                  </button>
                </div>
              </div>

              {isLoadingDocRoutes ? (
                <LoadingState title="Loading documentation routes..." />
              ) : groupedDocRoutes.length === 0 ? (
                <EmptyState
                  title="No doc routes yet"
                  description="Create a subsection route to structure this documentation resource."
                />
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-primary/[0.07] via-surface-container-low to-secondary-container/[0.06] p-4 sm:p-5 ring-1 ring-outline-variant/15 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.56fr)_minmax(0,0.72fr)] md:items-center md:gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveDocSectionIndex((index) => Math.max(0, index - 1))
                        }
                        disabled={activeDocSectionIndex <= 0}
                        className="flex min-h-[3.5rem] flex-col items-start justify-center rounded-lg border border-outline-variant/15 bg-white/45 px-3 py-2.5 text-left shadow-sm transition-all duration-300 ease-out hover:border-primary/25 hover:bg-white/85 hover:shadow-md enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 md:mx-auto md:w-full md:max-w-[13.5rem] md:scale-[0.94]"
                        aria-label={
                          activeDocSectionIndex > 0
                            ? `Go to previous section: ${groupedDocRoutes[activeDocSectionIndex - 1]?.[0] ?? ''}`
                            : 'No previous section'
                        }
                      >
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-outline/90">
                          Previous
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-on-surface/90">
                          {activeDocSectionIndex > 0
                            ? (groupedDocRoutes[activeDocSectionIndex - 1]?.[0] ?? '—')
                            : '—'}
                        </span>
                      </button>

                      <div
                        key={activeDocSectionIndex}
                        className="doc-section-header-animate relative z-[1] min-w-0 space-y-0.5 rounded-lg border border-primary/18 bg-white/55 px-3 py-2.5 text-center shadow-sm ring-1 ring-primary/12 md:px-3.5 md:py-3"
                      >
                        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-outline md:text-[9px]">
                          Current section
                        </p>
                        <p className="text-base font-black leading-tight tracking-tight text-on-surface md:text-lg">
                          {groupedDocRoutes[activeDocSectionIndex]?.[0] ?? '—'}
                        </p>
                        <p className="text-[10px] leading-snug text-on-surface-variant tabular-nums md:text-[11px]">
                          {activeDocSectionIndex + 1} of {docSectionCount} sections ·{' '}
                          {groupedDocRoutes[activeDocSectionIndex]?.[1].length ?? 0} route(s) here
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveDocSectionIndex((index) =>
                            Math.min(docSectionCount - 1, index + 1),
                          )
                        }
                        disabled={activeDocSectionIndex >= docSectionCount - 1}
                        className="flex min-h-[3.5rem] flex-col items-end justify-center rounded-lg border border-outline-variant/15 bg-white/45 px-3 py-2.5 text-right shadow-sm transition-all duration-300 ease-out hover:border-primary/25 hover:bg-white/85 hover:shadow-md enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 md:mx-auto md:w-full md:max-w-[13.5rem] md:scale-[0.94]"
                        aria-label={
                          activeDocSectionIndex < docSectionCount - 1
                            ? `Go to next section: ${groupedDocRoutes[activeDocSectionIndex + 1]?.[0] ?? ''}`
                            : 'No next section'
                        }
                      >
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-outline/90">
                          Next
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-on-surface/90">
                          {activeDocSectionIndex < docSectionCount - 1
                            ? (groupedDocRoutes[activeDocSectionIndex + 1]?.[0] ?? '—')
                            : '—'}
                        </span>
                      </button>
                    </div>

                    <div className="relative overflow-hidden rounded-xl">
                      <div
                        className="flex transition-[transform] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none will-change-transform"
                        style={{
                          width: `${docSectionCount * 100}%`,
                          transform: `translateX(-${(activeDocSectionIndex * 100) / docSectionCount}%)`,
                        }}
                      >
                        {groupedDocRoutes.map(([section, sectionRoutes]) => (
                          <div
                            key={section}
                            className="shrink-0 px-0.5 box-border"
                            style={{ width: `${100 / docSectionCount}%` }}
                          >
                            <div className="rounded-xl bg-surface-container-low/90 backdrop-blur-sm p-4 sm:p-5 border border-outline-variant/15 max-h-[min(33.6rem,62.5vh)] overflow-y-auto shadow-inner ring-1 ring-black/[0.03]">
                              <div className="mb-4 flex items-start justify-between gap-3 border-b border-outline-variant/10 pb-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-on-surface">{section}</p>
                                  <p className="text-xs text-outline mt-0.5">
                                    {sectionRoutes.length} subsection route(s)
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {sectionRoutes.map((docRoute) => (
                                  <div
                                    key={docRoute.id}
                                    className="rounded-lg bg-surface-container-lowest px-4 py-3 border border-outline-variant/10 transition-colors hover:border-outline-variant/25"
                                  >
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-on-surface">{docRoute.name}</p>
                                        <p className="text-xs text-on-surface-variant mt-1">
                                          {docRoute.description || 'No route description provided.'}
                                        </p>
                                        <a
                                          href={docRoute.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2 break-all"
                                        >
                                          <span className="break-all">{docRoute.url}</span>
                                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                        </a>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          type="button"
                                          disabled={!editable}
                                          onClick={() => openEditDocRouteModal(docRoute)}
                                          className="px-2.5 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={!editable}
                                          onClick={() => setDeleteDocRouteTarget(docRoute)}
                                          className="px-2.5 py-2 rounded-lg border border-outline-variant text-error hover:bg-error/5 transition-colors disabled:opacity-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1" role="tablist" aria-label="Documentation sections">
                      {groupedDocRoutes.map(([section], index) => (
                        <button
                          key={section}
                          type="button"
                          role="tab"
                          aria-selected={index === activeDocSectionIndex}
                          onClick={() => setActiveDocSectionIndex(index)}
                          className={`min-h-[9px] rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            index === activeDocSectionIndex
                              ? 'w-10 bg-primary shadow-sm'
                              : 'w-2.5 bg-outline-variant/35 hover:bg-outline-variant/60 hover:w-4'
                          }`}
                          aria-label={`Show section: ${section}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

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
                description="Edits to this resource will appear here once the backend records them."
              />
            ) : (
              <div className="space-y-6">
                {audits.map((audit, index) => (
                  <div key={audit.id} className={`relative pl-8 border-l-2 border-surface-container-high ${index < audits.length - 1 ? 'pb-6' : ''}`}>
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-surface-container-lowest" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-on-surface uppercase">{audit.action}</span>
                        <span className="text-[10px] text-outline">•</span>
                        <span className="text-xs font-medium text-on-surface-variant">
                          {adminNames[audit.created_by] ?? audit.created_by}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-outline">{formatDateTime(audit.created_at)}</span>
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
            <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-6">System Metadata</h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">Created By</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {initialsFromEmail(creatorName)}
                  </div>
                  <span className="text-sm font-semibold text-on-surface">{creatorName}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">Created At</label>
                <span className="text-sm font-medium text-on-surface-variant">{formatDateTime(resource.created_at)}</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">Last Updated</label>
                <span className="text-sm font-medium text-on-surface-variant">{formatRelativeTime(resource.created_at)}</span>
              </div>
              {resource.repository_id ? (
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">Repository ID</label>
                  <code className="text-xs bg-surface-container-highest/50 px-2 py-1 rounded font-mono text-on-surface-variant break-all">
                    {resource.repository_id}
                  </code>
                </div>
              ) : null}
              {resource.is_repository ? (
                <div>
                  <label className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block">Last Synced At</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-on-surface-variant">{formatDateTime(resource.last_synced_at)}</span>
                    <RefreshCw className="w-4 h-4 text-primary" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-primary-fixed">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Resource Health</h3>
            <div className="flex items-center gap-2 mb-2">
              <Clock3 className="w-5 h-5 text-primary" />
              <span className="text-xl font-black text-on-surface">{resource.is_repository ? 'Synced' : 'Tracked'}</span>
            </div>
            <p className="text-sm text-on-surface-variant">
              This record is connected to the live backend and reflects the latest admin mutations.
            </p>
          </div>

          <div className="bg-error-container/10 rounded-xl p-6 ring-1 ring-error/20">
            <h3 className="text-xs font-bold text-error uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              Deleting this resource will permanently remove it and any linked repository extension.
            </p>
            <button
              type="button"
              disabled={!editable}
              onClick={() => setDeleteOpen(true)}
              className="w-full py-2.5 rounded-lg border border-error text-error text-xs font-bold uppercase tracking-widest hover:bg-error hover:text-white transition-all disabled:opacity-60"
            >
              Delete Resource
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={isEditing}
        title="Edit Resource"
        description="Update this resource using the same backend-backed metadata contract as the list view."
        onClose={() => setIsEditing(false)}
        footer={(
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
              form="resource-detail-form"
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      >
        <form id="resource-detail-form" className="space-y-4" onSubmit={handleSubmit}>
          <InlineAlert message={formError} tone="error" />

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Title</label>
            <input
              value={formValues.title}
              onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">URL</label>
            <input
              value={formValues.url}
              onChange={(event) => setFormValues((current) => ({ ...current, url: event.target.value }))}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Description</label>
            <textarea
              rows={4}
              value={formValues.description}
              onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Source</label>
            <select
              value={formValues.source_id}
              onChange={(event) => setFormValues((current) => ({ ...current, source_id: event.target.value }))}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            >
              {sources.map((sourceOption) => (
                <option key={sourceOption.id} value={sourceOption.id}>
                  {sourceOption.title}
                </option>
              ))}
            </select>
          </div>

          {isExtendedResource ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">
                {isArticleResource ? 'Article Body' : 'Skill Content'}
              </label>
              <textarea
                rows={10}
                value={formValues.body}
                onChange={(event) => setFormValues((current) => ({ ...current, body: event.target.value }))}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-y"
              />
            </div>
          ) : (
            <label className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={formValues.is_documentation}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    is_documentation: event.target.checked,
                  }))}
              />
              <span>Treat this resource as documentation and enable docs subsections</span>
            </label>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline" htmlFor="resource-detail-tags-search">
              Tags
            </label>
            <TagMultiSelect
              key={resource.id}
              id="resource-detail-tags-search"
              tags={tags}
              selectedIds={formValues.tag_ids}
              onChange={(tag_ids) => setFormValues((current) => ({ ...current, tag_ids }))}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={isDocRouteModalOpen}
        title={editingDocRoute ? 'Edit Doc Route' : 'Create Doc Route'}
        description="Attach a subsection route to this documentation resource."
        onClose={() => {
          setIsDocRouteModalOpen(false);
          setEditingDocRoute(null);
          setDocRouteFormError(null);
          setDocRouteFormValues(buildDocRouteFormValues());
        }}
        footer={(
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsDocRouteModalOpen(false);
                setEditingDocRoute(null);
                setDocRouteFormError(null);
                setDocRouteFormValues(buildDocRouteFormValues());
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="doc-route-form"
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : editingDocRoute ? 'Save Route' : 'Create Route'}
            </button>
          </div>
        )}
      >
        <form id="doc-route-form" className="space-y-4" onSubmit={handleDocRouteSubmit}>
          <InlineAlert message={docRouteFormError} tone="error" />

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Name</label>
            <input
              value={docRouteFormValues.name}
              onChange={(event) =>
                setDocRouteFormValues((current) => ({ ...current, name: event.target.value }))}
              required
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Section</label>
              <input
                value={docRouteFormValues.section}
                onChange={(event) =>
                  setDocRouteFormValues((current) => ({ ...current, section: event.target.value }))}
                required
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-outline">URL</label>
              <input
                value={docRouteFormValues.url}
                onChange={(event) =>
                  setDocRouteFormValues((current) => ({ ...current, url: event.target.value }))}
                required
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-outline">Description</label>
            <textarea
              rows={4}
              value={docRouteFormValues.description}
              onChange={(event) =>
                setDocRouteFormValues((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm resize-none"
            />
          </div>
        </form>
      </Modal>

      <DocsViewerModal
        open={docsViewerOpen}
        resource={resource}
        sourceTitle={source?.title ?? 'Unknown source'}
        docRoutes={docRoutes}
        canUpload={editable}
        isUploadingDocRoutes={isSubmitting}
        onUploadDocRoutesCsv={
          resource.is_documentation ? onUploadDocRoutesCsv : undefined
        }
        onClose={() => setDocsViewerOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteDocRouteTarget)}
        title="Delete Doc Route"
        description={`This will permanently remove ${deleteDocRouteTarget?.name ?? 'this doc route'} from the documentation structure.`}
        confirmLabel="Delete Route"
        isPending={isSubmitting}
        onClose={() => setDeleteDocRouteTarget(null)}
        onConfirm={() => {
          if (deleteDocRouteTarget) {
            void onDeleteDocRoute(deleteDocRouteTarget).then(() =>
              setDeleteDocRouteTarget(null),
            );
          }
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Resource"
        description={`This action cannot be undone. ${resource.title} will be removed permanently.`}
        confirmLabel="Delete Resource"
        isPending={isSubmitting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void onDeleteResource(resource).then(() => setDeleteOpen(false));
        }}
      />
    </div>
  );
}
