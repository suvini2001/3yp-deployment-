import { Home, Map, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAlerts } from "@/context/AlertContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { alerts } = useAlerts();
  const pendingCount = alerts.filter((a) => a.status === "pending").length;

  const navItems = [
    { icon: Home,     label: "Home",    path: "/dashboard" },
    { icon: Map,      label: "Map",     path: "/map" },
    { icon: FileText, label: "Reports", path: "/reports" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom bottom-nav">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`
                flex flex-col items-center gap-1 px-6 py-2 rounded-2xl
                transition-all duration-300 relative group
                ${active
                  ? "nav-item-active"
                  : "text-muted-foreground hover:text-foreground hover:bg-blue-50/60"
                }
              `}
            >
              {/* Active indicator dot */}
              {active && (
                <span className="absolute top-1.5 w-1 h-1 rounded-full bg-blue-500 animate-glow-pulse" />
              )}

              {/* Icon wrapper */}
              <div className={`
                relative flex items-center justify-center w-8 h-8 rounded-xl
                transition-all duration-300
                ${active
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md-blue"
                  : "text-muted-foreground group-hover:text-blue-500"
                }
              `}>
                <Icon
                  size={18}
                  strokeWidth={active ? 2.4 : 1.8}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
              </div>

              <span className={`
                text-[10px] leading-tight tracking-wide font-semibold
                transition-colors duration-200
                ${active ? "text-blue-700" : "text-muted-foreground group-hover:text-blue-500"}
              `}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom safe area fill */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  );
};

export default BottomNav;
