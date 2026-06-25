import { Home, Beef, MapPin, Store, TrendingUp, Heart, FileText, Receipt, Building2, Bell, Settings, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: string;
}

export function Sidebar({ currentPage, onNavigate, userRole = "Farmer" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Dashboard", id: "dashboard" },
    { icon: Beef, label: "Animals", id: "animals" },
    { icon: MapPin, label: "Holdings", id: "holdings" },
    { icon: Store, label: "Marketplace", id: "marketplace" },
    { icon: TrendingUp, label: "Movements", id: "movements" },
    { icon: Heart, label: "Health Records", id: "health" },
    { icon: Receipt, label: "Transactions", id: "transactions" },
    { icon: Building2, label: "Abattoirs", id: "abattoirs" },
    { icon: FileText, label: "Reports", id: "reports" },
    { icon: Bell, label: "Notifications", id: "notifications" },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Beef className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-semibold text-sidebar-foreground">CattleTrace</h1>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setMobileOpen(false);
          }}
          className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors lg:block hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
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
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

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
