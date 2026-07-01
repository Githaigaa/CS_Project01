import { Beef, Menu, Settings, User, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { getRoleConfig } from "../lib/roleConfig";
import type { ApiUserRole } from "../lib/api/types";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: ApiUserRole;
  userName?: string;
}

export function Sidebar({
  currentPage,
  onNavigate,
  userRole,
  userName,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const config = getRoleConfig(userRole);

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <Beef className={cn("w-8 h-8 flex-shrink-0", config.accentColor)} />
            <div className="min-w-0">
              <h1 className="font-semibold text-sidebar-foreground truncate">CattleTrace</h1>
              <p className={cn("text-xs font-medium truncate", config.accentColor)}>
                {config.label}
              </p>
              {userName && (
                <p className="text-xs text-muted-foreground truncate">{userName}</p>
              )}
            </div>
          </div>
        )}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
          className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors lg:block hidden flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors lg:hidden flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {config.navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id + item.label}
              onClick={() => {
                onNavigate(item.id);
                setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => {
            onNavigate("settings");
            setMobileOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            currentPage === "settings"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <Settings className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={() => {
            onNavigate("profile");
            setMobileOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            currentPage === "profile"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <User className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span>Profile</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-card rounded-lg shadow-lg border border-border"
      >
        <Menu className="w-6 h-6" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
