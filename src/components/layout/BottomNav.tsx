import { Archive, Database, FileCode2, Newspaper, Sparkles, Tags, UserCircle } from 'lucide-react';
import { View } from '../../lib/types';

export function BottomNav({ currentView, onNavigate }: { currentView: View; onNavigate: (v: View) => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 grid grid-cols-7 items-center px-2 pb-safe h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-[#dfe3e7]/30 dark:border-slate-800 shadow-[0_-12px_32px_rgba(23,28,31,0.06)]">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
          currentView === 'dashboard' || currentView === 'detail'
            ? 'text-[#2563eb] dark:text-blue-400 font-bold bg-[#d5e3fc] dark:bg-blue-900/30 rounded-xl px-4 py-1'
            : 'text-[#737686] dark:text-slate-500 hover:text-[#171c1f] dark:hover:text-slate-200'
        }`}
      >
        <Archive className="w-5 h-5 mb-1" />
        <span className="font-['Inter'] text-[11px] font-medium uppercase tracking-wider">Resources</span>
      </button>
      <button
        onClick={() => onNavigate('sources')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
          currentView === 'sources'
            ? 'text-[#2563eb] dark:text-blue-400 font-bold bg-[#d5e3fc] dark:bg-blue-900/30 rounded-xl px-4 py-1'
            : 'text-[#737686] dark:text-slate-500 hover:text-[#171c1f] dark:hover:text-slate-200'
        }`}
      >
        <FileCode2 className="w-5 h-5 mb-1" />
        <span className="font-['Inter'] text-[11px] font-medium uppercase tracking-wider">Sources</span>
      </button>
      <button
        onClick={() => onNavigate('tags')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
          currentView === 'tags'
            ? 'text-[#2563eb] dark:text-blue-400 font-bold bg-[#d5e3fc] dark:bg-blue-900/30 rounded-xl px-3 py-1'
            : 'text-[#737686] dark:text-slate-500 hover:text-[#171c1f] dark:hover:text-slate-200'
        }`}
      >
        <Tags className="w-5 h-5 mb-1" />
        <span className="font-['Inter'] text-[11px] font-medium uppercase tracking-wider">Tags</span>
      </button>
      <button
        onClick={() => onNavigate('repositories')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
          currentView === 'repositories'
            ? 'text-[#2563eb] dark:text-blue-400 font-bold bg-[#d5e3fc] dark:bg-blue-900/30 rounded-xl px-3 py-1'
            : 'text-[#737686] dark:text-slate-500 hover:text-[#171c1f] dark:hover:text-slate-200'
        }`}
      >
        <Database className="w-5 h-5 mb-1" />
        <span className="font-['Inter'] text-[11px] font-medium uppercase tracking-wider">Repos</span>
      </button>
      <button
        onClick={() => onNavigate('articles')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
          currentView === 'articles' || currentView === 'article-detail'
            ? 'text-[#2563eb] dark:text-blue-400 font-bold bg-[#d5e3fc] dark:bg-blue-900/30 rounded-xl px-3 py-1'
            : 'text-[#737686] dark:text-slate-500 hover:text-[#171c1f] dark:hover:text-slate-200'
        }`}
      >
        <Newspaper className="w-5 h-5 mb-1" />
        <span className="font-['Inter'] text-[11px] font-medium uppercase tracking-wider">Articles</span>
      </button>
      <button
        onClick={() => onNavigate('skills')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
          currentView === 'skills' || currentView === 'skill-detail'
            ? 'text-[#2563eb] dark:text-blue-400 font-bold bg-[#d5e3fc] dark:bg-blue-900/30 rounded-xl px-3 py-1'
            : 'text-[#737686] dark:text-slate-500 hover:text-[#171c1f] dark:hover:text-slate-200'
        }`}
      >
        <Sparkles className="w-5 h-5 mb-1" />
        <span className="font-['Inter'] text-[11px] font-medium uppercase tracking-wider">Skills</span>
      </button>
      <button
        onClick={() => onNavigate('admin')}
        className={`flex flex-col items-center justify-center transition-all duration-300 ease-in-out ${
          currentView === 'admin'
            ? 'text-[#2563eb] dark:text-blue-400 font-bold bg-[#d5e3fc] dark:bg-blue-900/30 rounded-xl px-3 py-1'
            : 'text-[#737686] dark:text-slate-500 hover:text-[#171c1f] dark:hover:text-slate-200'
        }`}
      >
        <UserCircle className="w-5 h-5 mb-1" />
        <span className="font-['Inter'] text-[11px] font-medium uppercase tracking-wider">Profile</span>
      </button>
    </nav>
  );
}
