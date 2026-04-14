import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardCheck,
  ListChecks,
  Users,
  Wrench,
  BarChart3,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderOpen },
  { to: "/inspections", label: "Inspections", icon: ClipboardCheck },
  { to: "/checklists", label: "Checklists", icon: ListChecks },
  { to: "/users", label: "Users", icon: Users },
  { to: "/contractors", label: "Contractors", icon: Wrench },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar-bg text-sidebar-text w-64 min-h-screen",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-500">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-heading">Nosara</h1>
          <p className="text-xs text-sidebar-text/60">Snagging Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn("sidebar-link", isActive && "sidebar-link-active")
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-sidebar-text/40">
          Nosara v0.1.0
        </p>
      </div>
    </aside>
  );
}
