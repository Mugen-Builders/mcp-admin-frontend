import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, BookOpenText, ExternalLink, FolderTree, LoaderCircle, Upload } from 'lucide-react';

import { DocRoute, DocRouteUploadSummary, Resource } from '../lib/types';
import { formatDateTime, getErrorMessage } from '../lib/utils';
import { Modal } from './shared/Modal';
import { InlineAlert } from './shared/States';

type DocsViewerModalProps = {
  open: boolean;
  resource: Resource;
  sourceTitle: string;
  docRoutes: DocRoute[];
  canUpload?: boolean;
  isUploadingDocRoutes?: boolean;
  onUploadDocRoutesCsv?: (file: File) => Promise<DocRouteUploadSummary>;
  onClose: () => void;
};

export function DocsViewerModal({
  open,
  resource,
  sourceTitle,
  docRoutes,
  canUpload = false,
  isUploadingDocRoutes = false,
  onUploadDocRoutesCsv,
  onClose,
}: DocsViewerModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadExpanded, setUploadExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<DocRouteUploadSummary | null>(null);

  useEffect(() => {
    if (!open) {
      setUploadExpanded(false);
      setSelectedFile(null);
      setIsDragging(false);
      setUploadError(null);
      setUploadSummary(null);
    }
  }, [open]);

  const groupedSections = docRoutes.reduce<Record<string, DocRoute[]>>((accumulator, docRoute) => {
    const key = docRoute.section || 'General';
    accumulator[key] = [...(accumulator[key] ?? []), docRoute];
    return accumulator;
  }, {});

  const sections = Object.entries(groupedSections).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  function selectFile(file: File | null) {
    if (!file) {
      return;
    }

    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    if (!isCsv) {
      setSelectedFile(null);
      setUploadSummary(null);
      setUploadError('Select a valid CSV file before uploading.');
      return;
    }

    setSelectedFile(file);
    setUploadSummary(null);
    setUploadError(null);
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onUploadDocRoutesCsv) {
      return;
    }

    if (!selectedFile) {
      setUploadError('Choose a CSV file to continue.');
      return;
    }

    try {
      const summary = await onUploadDocRoutesCsv(selectedFile);
      setUploadSummary(summary);
      setUploadError(null);
    } catch (error) {
      setUploadError(getErrorMessage(error, 'Could not upload the CSV file.'));
    }
  }

  const showUpload = Boolean(canUpload && onUploadDocRoutesCsv);

  return (
    <Modal
      open={open}
      title={resource.title}
      description="Documentation structure grouped by subsection."
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
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

        {showUpload ? (
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm font-semibold text-on-surface">Bulk import doc routes</p>
              <button
                type="button"
                onClick={() => {
                  setUploadExpanded((current) => !current);
                  if (uploadExpanded) {
                    setSelectedFile(null);
                    setUploadSummary(null);
                    setUploadError(null);
                  }
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors shrink-0"
              >
                {uploadExpanded ? 'Hide upload' : 'Upload routes'}
              </button>
            </div>

            {uploadExpanded ? (
              isUploadingDocRoutes && !uploadSummary ? (
                <div className="py-8 text-center">
                  <LoaderCircle className="w-9 h-9 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-on-surface">Uploading routes...</p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    The CSV is being validated and imported. This may take a moment.
                  </p>
                </div>
              ) : uploadSummary ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Rows</p>
                        <p className="text-2xl font-black text-on-surface mt-1">{uploadSummary.rows_processed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Added</p>
                        <p className="text-2xl font-black text-primary mt-1">{uploadSummary.routes_added}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Already existed</p>
                        <p className="text-2xl font-black text-on-surface mt-1">
                          {uploadSummary.routes_skipped_existing}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">New sections</p>
                        <p className="text-2xl font-black text-on-surface mt-1">{uploadSummary.sections_added}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-outline-variant/10">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Rows with issues</p>
                      <p className="text-lg font-black text-error mt-1">{uploadSummary.wrongly_encoded_count}</p>
                    </div>
                  </div>

                  {uploadSummary.row_errors.length > 0 ? (
                    <div className="rounded-2xl border border-error/15 bg-error-container/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-error shrink-0" />
                        <p className="text-sm font-bold text-on-surface">Row-level issues</p>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {uploadSummary.row_errors.map((error, index) => (
                          <div
                            key={`${index}-${error}`}
                            className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant"
                          >
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadSummary(null);
                        setUploadError(null);
                        inputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      Upload another
                    </button>
                  </div>
                </div>
              ) : (
                <form id="doc-routes-upload-form" className="space-y-3" onSubmit={handleUploadSubmit}>
                  <InlineAlert message={uploadError} tone="error" />

                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        inputRef.current?.click();
                      }
                    }}
                    className={`rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/30 bg-surface-container-low'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-on-surface">Drag and drop your CSV here</p>
                    <p className="text-xs text-on-surface-variant mt-1">or click to browse your computer</p>
                    <p className="text-[11px] text-outline mt-2">
                      Required columns: title, url, description, section
                    </p>
                  </div>

                  {selectedFile ? (
                    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-3 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors shrink-0"
                      >
                        Replace
                      </button>
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUploadingDocRoutes || !selectedFile}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-70"
                    >
                      {isUploadingDocRoutes ? 'Uploading...' : 'Upload CSV'}
                    </button>
                  </div>
                </form>
              )
            ) : null}
          </div>
        ) : null}

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
              Add a doc route from the resource detail page or use Upload routes to import a CSV.
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
