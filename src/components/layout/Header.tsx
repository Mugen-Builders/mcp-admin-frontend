import { Bell, LogOut, RefreshCw } from "lucide-react";

import { AdminUser, View } from "../../lib/types";
import { initialsFromEmail } from "../../lib/utils";

const VIEW_LABELS: Record<View, string> = {
  dashboard: "Resources",
  detail: "Resource Details",
  sources: "Sources",
  repositories: "Repositories",
  articles: "Articles",
  "article-detail": "Article Details",
  skills: "Skills",
  "skill-detail": "Skill Details",
  tags: "Tags",
  admin: "Administrators",
};

type HeaderProps = {
  currentView: View;
  currentAdmin: AdminUser;
  isRefreshing?: boolean;
  onRefresh: () => void;
  onLogout: () => void;
};

export function Header({
  currentView,
  currentAdmin,
  isRefreshing = false,
  onRefresh,
  onLogout,
}: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 flex items-center justify-between px-4 md:px-8 bg-white/92 backdrop-blur-md border-b border-slate-200/70 shadow-[0_10px_30px_rgba(15,23,42,0.05)] z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col">
          {/* <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Cartesi MCP Workspace</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            {VIEW_LABELS[currentView]}
          </span> */}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full ring-1 ring-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-sans text-xs font-semibold tracking-tight text-emerald-700">
            alpha release
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors scale-95 active:scale-90 disabled:opacity-60"
            aria-label="Refresh data"
          >
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
          </button>
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors scale-95 active:scale-90">
            <Bell className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors scale-95 active:scale-90"
            aria-label="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-3 pl-2 pr-1 py-1.5">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/10 text-xs font-bold">
              {initialsFromEmail(currentAdmin.email)}
            </div>
            <div className="hidden lg:block min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {currentAdmin.email}
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {currentAdmin.is_superuser ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
