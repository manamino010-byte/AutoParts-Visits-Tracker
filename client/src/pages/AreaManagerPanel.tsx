import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, setDate } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, ChevronDown, ChevronUp, Clock, CheckCircle2, MapPin } from "lucide-react";
import { AdminLangProvider, useLang } from "@/lib/i18n";
import { AdminThemeProvider, useAdminTheme } from "@/lib/adminTheme";
import { SERVER_BASE_URL } from "@/lib/config";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}س ${m}د`;
  return `${m} دقيقة`;
}

function durationMin(checkIn: any, checkOut: any): number {
  if (!checkOut) return 0;
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60_000);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, size = 36 }: { name?: string | null; photoUrl?: string | null; size?: number }) {
  const src = photoUrl ? `${SERVER_BASE_URL}${photoUrl}` : null;
  const style: React.CSSProperties = {
    width: size, height: size, borderRadius: size / 2, flexShrink: 0, objectFit: "cover" as const,
  };
  if (src) return <img src={src} alt={name ?? ""} style={style} />;
  return (
    <div style={{
      ...style,
      background: "linear-gradient(135deg, rgba(92,184,196,0.18), rgba(186,237,240,0.30))",
      border: "1.5px solid rgba(92,184,196,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#5cb8c4",
    }}>
      {name?.charAt(0) || "?"}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function PanelSidebar({ page, setPage }: { page: "home" | "reports"; setPage: (p: "home" | "reports") => void }) {
  const { user } = useAuth();
  const { theme } = useAdminTheme();

  const navItems = [
    { icon: "dashboard", label: "الرئيسية", page: "home" as const },
    { icon: "assessment", label: "تقارير الفريق", page: "reports" as const },
  ];

  return (
    <aside className="admin-root" style={{
      width: 220, flexShrink: 0, height: "100svh", position: "sticky", top: 0,
      background: "var(--adm-surface)", borderLeft: "1px solid var(--adm-border)",
      display: "flex", flexDirection: "column", gap: 0, overflowY: "auto",
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid var(--adm-border)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--adm-text-1)" }}>لوحة متابعة الفريق</div>
        <div style={{ fontSize: 11, color: "var(--adm-text-3)", marginTop: 2 }}>{user?.name}</div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {navItems.map((item) => {
          const active = page === item.page;
          return (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 4, border: "none", cursor: "pointer",
                background: active ? "var(--adm-accent)" : "transparent",
                color: active ? "var(--adm-accent-fg)" : "var(--adm-text-2)",
                fontWeight: active ? 700 : 500, fontSize: 13, textAlign: "start",
                transition: "all .15s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Back Button */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--adm-border)" }}>
        <Link href="/">
          <a style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, color: "var(--adm-text-2)", fontSize: 13, fontWeight: 500,
            textDecoration: "none", background: "var(--adm-bg)", border: "1px solid var(--adm-border)",
            cursor: "pointer", transition: "all .15s",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            العودة للوضع الميداني
          </a>
        </Link>
      </div>
    </aside>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function PanelHome() {
  const now = Date.now();
  const { data: subordinates = [], isLoading } = trpc.manager.getSubordinateBranchManagers.useQuery(undefined, {
    staleTime: 30_000, refetchInterval: 60_000,
  });

  const subs = subordinates as any[];
  const activeCount = subs.filter((s) => s.activeVisit).length;

  return (
    <div className="admin-root" style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--adm-text-1)", letterSpacing: "-0.02em", margin: 0 }}>
          لوحة متابعة الفريق
        </h1>
        <p style={{ fontSize: 13, color: "var(--adm-text-2)", marginTop: 4 }}>
          حالة مديري الفروع التابعين لمنطقتك
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "إجمالي المديرين", value: isLoading ? "—" : subs.length, icon: "group", color: "var(--adm-text-1)" },
          { label: "متواجدون الآن", value: isLoading ? "—" : activeCount, icon: "sensors", color: "var(--adm-green)" },
          { label: "غير متواجدين", value: isLoading ? "—" : subs.length - activeCount, icon: "person_off", color: "var(--adm-text-3)" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: "var(--adm-surface)", border: "1px solid var(--adm-border)",
            borderRadius: 16, padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--adm-text-3)", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--adm-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Managers Table */}
      <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--adm-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--adm-text-3)" }}>
            مديرو الفروع
          </p>
          <span style={{ fontSize: 12, color: "var(--adm-text-3)" }}>{subs.length} مدير</span>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--adm-text-3)" }} />
          </div>
        ) : subs.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--adm-text-3)" }}>group_off</span>
            <p style={{ fontSize: 14, color: "var(--adm-text-2)", marginTop: 8 }}>لا يوجد مديرو فروع مرتبطون بمنطقتك بعد</p>
          </div>
        ) : (
          <div>
            {subs.map((sub: any, i: number) => {
              const isActive = !!sub.activeVisit;
              const duration = isActive ? formatDuration(now - new Date(sub.activeVisit.checkInAt).getTime()) : null;
              return (
                <div key={sub.managerId} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                  borderBottom: i < subs.length - 1 ? "1px solid var(--adm-border)" : "none",
                  transition: "background .15s",
                }}>
                  {/* Avatar + Status dot */}
                  <div style={{ position: "relative" }}>
                    <Avatar name={sub.name} photoUrl={sub.photoUrl} size={40} />
                    <div style={{
                      position: "absolute", bottom: -1, right: -1,
                      width: 13, height: 13, borderRadius: "50%",
                      background: isActive ? "var(--adm-green)" : "var(--adm-text-3)",
                      border: "2px solid var(--adm-surface)",
                    }} />
                  </div>

                  {/* Name & Branch */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--adm-text-1)", margin: 0 }}>
                      {sub.name ?? "—"}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--adm-text-3)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>store</span>
                      {sub.branchName}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div style={{ textAlign: "end" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: isActive ? "var(--adm-green-soft)" : "var(--adm-bg)",
                      color: isActive ? "var(--adm-green)" : "var(--adm-text-3)",
                      border: `1px solid ${isActive ? "rgba(52,211,153,0.3)" : "var(--adm-border)"}`,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: isActive ? "var(--adm-green)" : "var(--adm-text-3)",
                        flexShrink: 0,
                      }} />
                      {isActive ? "متواجد بالفرع" : "غير متواجد"}
                    </span>
                    {duration && (
                      <p style={{ fontSize: 11, color: "var(--adm-text-3)", margin: "4px 0 0" }}>منذ {duration}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
function PanelReports() {
  const now = new Date();
  const defaultStart = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultEnd = format(
    now.getDate() >= 20 ? endOfMonth(now) : setDate(addMonths(now, 1), 20),
    "yyyy-MM-dd"
  );

  const [filters, setFilters] = useState({ startDate: defaultStart, endDate: defaultEnd, managerId: "" });
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const { data: subordinates = [] } = trpc.manager.getSubordinateBranchManagers.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const subs = subordinates as any[];

  // Build managerId list from subordinates
  const subManagerIds = subs.map((s: any) => s.managerId);

  const queryInput = {
    managerId: filters.managerId ? Number(filters.managerId) : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    limit: 1000,
    offset: 0,
  };

  const { data, isLoading } = trpc.visit.adminList.useQuery(queryInput, {
    enabled: subManagerIds.length > 0,
  });

  // Filter to only subordinates' visits
  const allVisits = (data?.items ?? []) as any[];
  const visits = allVisits.filter((v: any) => {
    if (filters.managerId) return v.managerId === Number(filters.managerId);
    return subManagerIds.includes(v.managerId);
  });

  // Group by day
  const dayGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const v of visits) {
      const day = format(new Date(v.checkInAt), "yyyy-MM-dd");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(v);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, dayVisits]) => ({
        date,
        dateLabel: format(new Date(date), "EEEE، d MMMM yyyy", { locale: ar }),
        visits: dayVisits,
      }));
  }, [visits]);

  const checkedOut = visits.filter((v) => v.checkOutAt);
  const totalMin = checkedOut.reduce((acc, v) => acc + durationMin(v.checkInAt, v.checkOutAt), 0);

  return (
    <div className="admin-root" style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--adm-text-1)", letterSpacing: "-0.02em", margin: 0 }}>
          تقارير الفريق
        </h1>
        <p style={{ fontSize: 13, color: "var(--adm-text-2)", marginTop: 4 }}>
          زيارات مديري الفروع التابعين لمنطقتك
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: "var(--adm-surface)", border: "1px solid var(--adm-border)",
        borderRadius: 16, padding: 16, marginBottom: 20,
        display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end",
      }}>
        {/* Manager Filter */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--adm-text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>المدير</label>
          <select
            value={filters.managerId}
            onChange={(e) => setFilters((f) => ({ ...f, managerId: e.target.value }))}
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: "var(--adm-bg)", border: "1px solid var(--adm-border)",
              color: "var(--adm-text-1)", outline: "none",
            }}
          >
            <option value="">جميع مديري الفروع</option>
            {subs.map((s: any) => (
              <option key={s.managerId} value={s.managerId}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Date Filters */}
        {(["startDate", "endDate"] as const).map((key) => (
          <div key={key} style={{ flex: 1, minWidth: 130 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--adm-text-3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {key === "startDate" ? "من" : "إلى"}
            </label>
            <input
              type="date"
              value={filters[key]}
              onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 10, fontSize: 13,
                background: "var(--adm-bg)", border: "1px solid var(--adm-border)",
                color: "var(--adm-text-1)", outline: "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "إجمالي الزيارات", value: visits.length, icon: "place", color: "var(--adm-text-1)" },
          { label: "ساعات العمل", value: `${Math.floor(totalMin / 60)}س ${totalMin % 60}د`, icon: "schedule", color: "var(--adm-blue)" },
          { label: "نشطة الآن", value: visits.filter((v) => v.status === "checked_in").length, icon: "sensors", color: "var(--adm-green)" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: "var(--adm-surface)", border: "1px solid var(--adm-border)",
            borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--adm-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--adm-text-3)", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.2, margin: "2px 0 0" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Day Groups */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--adm-text-3)" }} />
        </div>
      ) : dayGroups.length === 0 ? (
        <div style={{
          background: "var(--adm-surface)", border: "1px solid var(--adm-border)",
          borderRadius: 16, padding: "48px 0", textAlign: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--adm-text-3)" }}>inbox</span>
          <p style={{ fontSize: 14, color: "var(--adm-text-2)", marginTop: 8 }}>لا توجد زيارات في هذه الفترة</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dayGroups.map((group) => {
            const open = expandedDay === group.date;
            const dayMin = group.visits.filter((v: any) => v.checkOutAt).reduce((acc: number, v: any) => acc + durationMin(v.checkInAt, v.checkOutAt), 0);
            return (
              <div key={group.date} style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 14, overflow: "hidden" }}>
                {/* Day Header */}
                <button
                  onClick={() => setExpandedDay(open ? null : group.date)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 18px", border: "none", background: "transparent", cursor: "pointer",
                    color: "var(--adm-text-1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, background: "var(--adm-accent)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--adm-accent-fg)", fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                    </div>
                    <div style={{ textAlign: "start" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--adm-text-1)", margin: 0 }}>{group.dateLabel}</p>
                      <p style={{ fontSize: 11, color: "var(--adm-text-3)", margin: "2px 0 0" }}>
                        {group.visits.length} زيارات — {Math.floor(dayMin / 60)}س {dayMin % 60}د
                      </p>
                    </div>
                  </div>
                  {open ? <ChevronUp size={16} style={{ color: "var(--adm-text-3)" }} /> : <ChevronDown size={16} style={{ color: "var(--adm-text-3)" }} />}
                </button>

                {/* Visits */}
                {open && (
                  <div style={{ borderTop: "1px solid var(--adm-border)" }}>
                    {group.visits.map((v: any, i: number) => {
                      const dur = v.checkOutAt ? `${durationMin(v.checkInAt, v.checkOutAt)} د` : "نشطة الآن";
                      const isCheckedIn = v.status === "checked_in";
                      return (
                        <div key={v.id} style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
                          borderBottom: i < group.visits.length - 1 ? "1px solid var(--adm-border)" : "none",
                          background: "var(--adm-bg)",
                        }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: isCheckedIn ? "var(--adm-green-soft)" : "var(--adm-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: isCheckedIn ? "var(--adm-green)" : "var(--adm-text-3)", fontVariationSettings: "'FILL' 1" }}>
                              {isCheckedIn ? "sensors" : "check_circle"}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--adm-text-1)", margin: 0 }}>
                              {v.managerName} — <span style={{ color: "var(--adm-text-2)", fontWeight: 400 }}>{v.branchName}</span>
                            </p>
                            <p style={{ fontSize: 11, color: "var(--adm-text-3)", margin: "2px 0 0" }}>
                              {format(new Date(v.checkInAt), "hh:mm a")}
                              {v.checkOutAt ? ` → ${format(new Date(v.checkOutAt), "hh:mm a")}` : ""}
                            </p>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                            background: isCheckedIn ? "var(--adm-green-soft)" : "var(--adm-surface)",
                            color: isCheckedIn ? "var(--adm-green)" : "var(--adm-text-2)",
                            border: `1px solid ${isCheckedIn ? "rgba(52,211,153,0.3)" : "var(--adm-border)"}`,
                            flexShrink: 0,
                          }}>
                            {dur}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel Component ─────────────────────────────────────────────────────
function AreaManagerPanelInner() {
  const [page, setPage] = useState<"home" | "reports">("home");
  const { theme } = useAdminTheme();

  return (
    <div className={`admin-root ${theme === "dark" ? "dark" : ""}`} style={{
      display: "flex", flexDirection: "row-reverse", minHeight: "100svh",
      background: "var(--adm-bg)",
    }}>
      <PanelSidebar page={page} setPage={setPage} />
      <main style={{ flex: 1, overflowY: "auto" }}>
        {page === "home" ? <PanelHome /> : <PanelReports />}
      </main>
    </div>
  );
}

export default function AreaManagerPanel() {
  return (
    <AdminLangProvider>
      <AdminThemeProvider>
        <AreaManagerPanelInner />
      </AdminThemeProvider>
    </AdminLangProvider>
  );
}
