import { Home, Search, Calendar, User } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";

export function PlayerBottomNav() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface border-t border-border">
      <div className="max-w-[430px] mx-auto h-full flex justify-between items-stretch">
        <Link
          to="/home"
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive("/home") 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="size-6" />
          <span className="text-xs font-bold">الرئيسية</span>
        </Link>
        
        <Link
          to="/search"
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive("/search") 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="size-6" />
          <span className="text-xs font-bold">ابحث</span>
        </Link>
        
        <Link
          to="/bookings"
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive("/bookings") 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="size-6" />
          <span className="text-xs font-bold">حجوزاتي</span>
        </Link>
        
        <Link
          to="/player-profile"
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive("/player-profile") 
              ? "text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="size-6" />
          <span className="text-xs font-bold">ملفي</span>
        </Link>
      </div>
    </nav>
  );
}
