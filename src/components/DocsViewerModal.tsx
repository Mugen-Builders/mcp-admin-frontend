import { BookOpenText, ExternalLink, FolderTree } from 'lucide-react';

import { DocRoute, Resource } from '../lib/types';
import { formatDateTime } from '../lib/utils';
import { Modal } from './shared/Modal';

type DocsViewerModalProps = {
  open: boolean;
  resource: Resource;
  sourceTitle: string;
  docRoutes: DocRoute[];
  onClose: () => void;
};

export function DocsViewerModal({
  open,
  resource,
  sourceTitle,
  docRoutes,
  onClose,
}: DocsViewerModalProps) {
  const groupedSections = docRoutes.reduce<Record<string, DocRoute[]>>((accumulator, docRoute) => {
    const key = docRoute.section || 'General';
    accumulator[key] = [...(accumulator[key] ?? []), docRoute];
    return accumulator;
  }, {});

  const sections = Object.entries(groupedSections).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <Modal
      open={open}
      title={resource.title}
      description="Documentation structure grouped by subsection."
      onClose={onClose}
      footer={(
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-surface-container-low px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Source</p>
            <p className="mt-1 text-sm font-semibold text-on-surface">{sourceTitle}</p>
          </div>
          <div className="rounded-xl bg-surface-container-low px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Sections</p>
            <p className="mt-1 text-sm font-semibold text-on-surface">{sections.length}</p>
          </div>
          <div className="rounded-xl bg-surface-container-low px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Sub-routes</p>
            <p className="mt-1 text-sm font-semibold text-on-surface">{docRoutes.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <div className="flex items-start gap-3">
            <BookOpenText className="mt-0.5 h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-on-surface">Documentation metadata</p>
              <p className="text-sm text-on-surface-variant mt-1">
                {resource.description || 'No documentation summary provided.'}
              </p>
              <p className="text-xs text-outline mt-2">Created {formatDateTime(resource.created_at)}</p>
            </div>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-4 py-8 text-center">
            <p className="text-sm font-semibold text-on-surface">No documentation subsections yet.</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Add a doc route from the resource detail page to build this view.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map(([section, routes]) => (
              <section key={section} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FolderTree className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-bold text-on-surface">{section}</h4>
                  <span className="text-xs text-outline">({routes.length})</span>
                </div>

                <div className="space-y-3">
                  {routes.map((docRoute) => (
                    <div key={docRoute.id} className="rounded-lg bg-surface-container-low px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface">{docRoute.name}</p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {docRoute.description || 'No route description provided.'}
                          </p>
                        </div>
                        <a
                          href={docRoute.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                        >
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <p className="text-xs text-outline mt-2 break-all">{docRoute.url}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
