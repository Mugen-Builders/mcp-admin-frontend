import {
  Archive,
  Database,
  FileCode2,
  LogOut,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Tags,
  UserCircle,
} from 'lucide-react';

import { BrandLogo } from '../shared/BrandLogo';
import { View, AdminUser } from '../../lib/types';
import { initialsFromEmail } from '../../lib/utils';

type SidebarProps = {
  currentView: View;
  currentAdmin: AdminUser;
  onNavigate: (view: View) => void;
  onLogout: () => void;
};

export function Sidebar({ currentView, currentAdmin, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[linear-gradient(180deg,#060b1c_0%,#081126_52%,#0b1731_100%)] flex-col h-full p-6 border-r border-white/8 z-50 shadow-[18px_0_40px_rgba(2,6,23,0.22)]">
      <div className="mb-8">
        <BrandLogo size="sm" />
      </div>
      <nav className="flex-1 space-y-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 py-2 px-4 transition-all font-sans text-xs font-medium uppercase tracking-wider rounded-lg ${
            currentView === 'dashboard' || currentView === 'detail'
              ? 'text-white bg-primary/20 ring-1 ring-primary/25 shadow-[0_8px_24px_rgba(0,74,198,0.18)]'
              : 'text-slate-300 hover:text-white hover:bg-white/6'
          }`}
        >
          <Archive className="w-5 h-5" />
          <span>Resources</span>
        </button>
        <button
          onClick={() => onNavigate('sources')}
          className={`w-full flex items-center gap-3 py-2 px-4 transition-all font-sans text-xs font-medium uppercase tracking-wider rounded-lg ${
            currentView === 'sources'
              ? 'text-white bg-primary/20 ring-1 ring-primary/25 shadow-[0_8px_24px_rgba(0,74,198,0.18)]'
              : 'text-slate-300 hover:text-white hover:bg-white/6'
          }`}
        >
          <FileCode2 className="w-5 h-5" />
          <span>Sources</span>
        </button>
        <button
          onClick={() => onNavigate('tags')}
          className={`w-full flex items-center gap-3 py-2 px-4 transition-all font-sans text-xs font-medium uppercase tracking-wider rounded-lg ${
            currentView === 'tags'
              ? 'text-white bg-primary/20 ring-1 ring-primary/25 shadow-[0_8px_24px_rgba(0,74,198,0.18)]'
              : 'text-slate-300 hover:text-white hover:bg-white/6'
          }`}
        >
          <Tags className="w-5 h-5" />
          <span>Tags</span>
        </button>
        <button
          onClick={() => onNavigate('repositories')}
          className={`w-full flex items-center gap-3 py-2 px-4 transition-all font-sans text-xs font-medium uppercase tracking-wider rounded-lg ${
            currentView === 'repositories'
              ? 'text-white bg-primary/20 ring-1 ring-primary/25 shadow-[0_8px_24px_rgba(0,74,198,0.18)]'
              : 'text-slate-300 hover:text-white hover:bg-white/6'
          }`}
        >
          <Database className="w-5 h-5" />
          <span>Repositories</span>
        </button>
        <button
          onClick={() => onNavigate('articles')}
          className={`w-full flex items-center gap-3 py-2 px-4 transition-all font-sans text-xs font-medium uppercase tracking-wider rounded-lg ${
            currentView === 'articles' || currentView === 'article-detail'
              ? 'text-white bg-primary/20 ring-1 ring-primary/25 shadow-[0_8px_24px_rgba(0,74,198,0.18)]'
              : 'text-slate-300 hover:text-white hover:bg-white/6'
          }`}
        >
          <Newspaper className="w-5 h-5" />
          <span>Articles</span>
        </button>
        <button
          onClick={() => onNavigate('skills')}
          className={`w-full flex items-center gap-3 py-2 px-4 transition-all font-sans text-xs font-medium uppercase tracking-wider rounded-lg ${
            currentView === 'skills' || currentView === 'skill-detail'
              ? 'text-white bg-primary/20 ring-1 ring-primary/25 shadow-[0_8px_24px_rgba(0,74,198,0.18)]'
              : 'text-slate-300 hover:text-white hover:bg-white/6'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Skills</span>
        </button>
      </nav>
      <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
        <div className="px-4 py-4 mb-3 rounded-2xl bg-white/6 ring-1 ring-white/10 shadow-[0_12px_30px_rgba(2,6,23,0.18)] backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
            Signed In As
          </p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/18 text-primary-fixed flex items-center justify-center font-bold ring-1 ring-primary/20">
              {initialsFromEmail(currentAdmin.email)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentAdmin.email}</p>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-sky-300 mt-1">
                <ShieldCheck className="w-3 h-3" />
                {currentAdmin.is_superuser ? 'Super Admin' : 'Admin'}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigate('admin')}
          className={`w-full flex items-center gap-3 py-2 px-4 transition-all font-sans text-xs font-medium uppercase tracking-wider rounded-lg ${
            currentView === 'admin'
              ? 'text-white bg-primary/20 ring-1 ring-primary/25 shadow-[0_8px_24px_rgba(0,74,198,0.18)]'
              : 'text-slate-300 hover:text-white hover:bg-white/6'
          }`}
        >
          <UserCircle className="w-5 h-5" />
          <span>Admin</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 text-slate-300 hover:text-white py-2 px-4 transition-all font-sans text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-white/6"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
