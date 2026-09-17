import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Nav items shared by all field managers ────────────────────────────────────
const BASE_NAV_ITEMS = [
  { icon: "home",          label: "الرئيسية",   path: "/" },
  { icon: "location_on",   label: "الفروع",     path: "/check-in" },
  { icon: "history",       label: "السجل",      path: "/history" },
  { icon: "bar_chart",     label: "تقاريري",    path: "/reports" },
  { icon: "sync",          label: "المزامنة",   path: "/sync" },
];

// ── Extra tab for area_manager only ──────────────────────────────────────────
const AREA_MANAGER_EXTRA = {
  icon: "calendar_month",
  label: "جدولتي",
  path: "/schedule",
};

export function ManagerBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const isAreaManager = user?.role === "area_manager" || user?.role === "user";

  // مدير المنطقة يرى تاب الجدول — مدير الفرع لا يراه
  const NAV_ITEMS = isAreaManager
    ? [...BASE_NAV_ITEMS, AREA_MANAGER_EXTRA]
    : BASE_NAV_ITEMS;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(17, 20, 23, 0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = location === item.path || (item.path === "/" && location === "/dashboard");
          // للجدول: لون بنفسجي بدل الأزرق
          const activeColor = item.path === "/schedule" ? "#6366f1" : "#0fa5f8";

          return (
            <Link key={item.path} href={item.path}>
              <a
                className="flex flex-col items-center justify-center cursor-pointer relative"
                style={{ minWidth: 52, height: "100%" }}
              >
                {/* Active Indicator */}
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: `${activeColor}18`,
                      zIndex: 0,
                    }}
                  />
                )}

                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 23,
                    color: active ? activeColor : "rgba(255, 255, 255, 0.35)",
                    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                    transition: "all 0.2s ease",
                    zIndex: 1,
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    marginTop: 2,
                    fontFamily: "'Cairo', sans-serif",
                    color: active ? activeColor : "rgba(255, 255, 255, 0.35)",
                    transition: "color 0.2s ease",
                    zIndex: 1,
                    letterSpacing: "0.01em",
                  }}
                >
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
