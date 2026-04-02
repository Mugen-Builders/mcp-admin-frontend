import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Search, X } from 'lucide-react';

import { Tag } from '../../lib/types';

const MAX_SUGGESTIONS = 20;

type TagMultiSelectProps = {
  tags: Tag[];
  selectedIds: string[];
  onChange: (tagIds: string[]) => void;
  id?: string;
  placeholder?: string;
};

export function TagMultiSelect({
  tags,
  selectedIds,
  onChange,
  id,
  placeholder = 'Type to search tags…',
}: TagMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedTags = useMemo(
    () => selectedIds.map((tid) => tags.find((t) => t.id === tid)).filter(Boolean) as Tag[],
    [tags, selectedIds],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = tags.filter((t) => !selectedSet.has(t.id));
    if (!q) {
      return [];
    }
    const scored = pool
      .map((t) => {
        const title = t.title.toLowerCase();
        const idx = title.indexOf(q);
        if (idx === -1) {
          return null;
        }
        const starts = idx === 0 ? 0 : 1;
        return { tag: t, starts, idx };
      })
      .filter(Boolean) as { tag: Tag; starts: number; idx: number }[];
    scored.sort(
      (a, b) => a.starts - b.starts || a.idx - b.idx || a.tag.title.localeCompare(b.tag.title),
    );
    return scored.slice(0, MAX_SUGGESTIONS).map((s) => s.tag);
  }, [tags, selectedSet, query]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, suggestions.length]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const addTag = useCallback(
    (tagId: string) => {
      if (selectedSet.has(tagId)) {
        return;
      }
      onChange([...selectedIds, tagId]);
      setQuery('');
      setOpen(false);
      inputRef.current?.focus();
    },
    [onChange, selectedIds, selectedSet],
  );

  const removeTag = useCallback(
    (tagId: string) => {
      onChange(selectedIds.filter((x) => x !== tagId));
    },
    [onChange, selectedIds],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (suggestions.length === 0) {
        return;
      }
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (suggestions.length === 0) {
        return;
      }
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === 'Enter' && open && suggestions[highlightIndex]) {
      event.preventDefault();
      addTag(suggestions[highlightIndex].id);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-low/50 px-3 py-2.5">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex max-w-full items-center gap-1 rounded-lg bg-primary/12 py-1 pl-2.5 pr-1 text-xs font-bold text-primary ring-1 ring-primary/15"
            >
              <span className="truncate">{tag.title}</span>
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="shrink-0 rounded-md p-0.5 text-primary transition-colors hover:bg-primary/15"
                aria-label={`Remove ${tag.title}`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-outline" />
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low py-3 pr-4 pl-10 text-sm text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
        {open && query.trim() && suggestions.length > 0 ? (
          <ul
            className="absolute z-[110] mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest py-1 shadow-lg ring-1 ring-black/5"
            role="listbox"
          >
            {suggestions.map((tag, idx) => (
              <li
                key={tag.id}
                role="option"
                aria-selected={idx === highlightIndex}
                className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm ${
                  idx === highlightIndex
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
                onMouseEnter={() => setHighlightIndex(idx)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(tag.id)}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                {tag.title}
              </li>
            ))}
          </ul>
        ) : null}
        {open && query.trim() && suggestions.length === 0 ? (
          <div className="absolute z-[110] mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant shadow-lg">
            No tags match “{query.trim()}”.
          </div>
        ) : null}
      </div>
    </div>
  );
}
