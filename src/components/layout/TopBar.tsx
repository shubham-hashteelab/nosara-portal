import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { clearBackendUrl } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, Server } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangeServer = () => {
    clearBackendUrl();
    logout();
    navigate("/setup");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-100 bg-white px-4 sm:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900">
              {user?.full_name ?? "User"}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.toLowerCase() ?? ""}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleChangeServer}>
            <Server className="h-4 w-4 mr-2" />
            Change Server
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
