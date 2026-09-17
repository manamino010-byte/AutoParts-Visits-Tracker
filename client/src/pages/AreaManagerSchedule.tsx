import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Calendar, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";

// ── Days of week ──────────────────────────────────────────────────────────────
const DAYS = [
  { id: 1, label: "الإثنين", short: "الإث", color: "#6366f1" },
  { id: 2, label: "الثلاثاء", short: "الث", color: "#8b5cf6" },
  { id: 3, label: "الأربعاء", short: "الأر", color: "#0fa5f8" },
  { id: 4, label: "الخميس", short: "الخ", color: "#10b981" },
  { id: 5, label: "الجمعة", short: "الج", color: "#f59e0b" },
  { id: 6, label: "السبت", short: "الس", color: "#ef4444" },
  { id: 0, label: "الأحد", short: "الأح", color: "#64748b" },
];

const DAY_NAMES: Record<number, string> = Object.fromEntries(DAYS.map(d => [d.id, d.label]));
const DAY_COLORS: Record<number, string> = Object.fromEntries(DAYS.map(d => [d.id, d.color]));

// ── Add Entry Form ────────────────────────────────────────────────────────────
function AddEntryForm({
  branches,
  onAdded,
}: {
  branches: any[];
  onAdded: () => void;
}) {
  const [selectedBranch, setSelectedBranch] = useState<number | "">("");
  const [selectedDay, setSelectedDay] = useState<number | "">("");
  const [plannedTime, setPlannedTime] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const addMutation = trpc.schedule.addEntry.useMutation({
    onSuccess: () => {
      toast.success("✅ تمت إضافة الزيارة للجدول");
      setSelectedBranch("");
      setSelectedDay("");
      setPlannedTime("");
      setNote("");
      setOpen(false);
      onAdded();
    },
    onError: (e) => toast.error(`❌ ${e.message}`),
  });

  const handleAdd = () => {
    if (selectedBranch === "" || selectedDay === "") {
      toast.error("اختر الفرع واليوم أولاً");
      return;
    }
    addMutation.mutate({
      branchId: selectedBranch as number,
      dayOfWeek: selectedDay as number,
      plannedTime: plannedTime || undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <div
      style={{
        background: "rgba(15,165,248,0.06)",
        border: "1px solid rgba(15,165,248,0.2)",
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "16px 20px",
          background: "none",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          color: "#0fa5f8",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(15,165,248,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Plus size={18} color="#0fa5f8" />
        </div>
        <span
          style={{
            flex: 1,
            textAlign: "right",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          إضافة زيارة جديدة للجدول
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            borderTop: "1px solid rgba(15,165,248,0.15)",
          }}
        >
          {/* Branch select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", letterSpacing: "0.05em" }}>
              الفرع
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value === "" ? "" : Number(e.target.value))}
              dir="rtl"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 13,
                fontFamily: "'Cairo', sans-serif",
                outline: "none",
              }}
            >
              <option value="">— اختر الفرع —</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Day select */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", letterSpacing: "0.05em" }}>
              اليوم
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAYS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDay(d.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: selectedDay === d.id ? `2px solid ${d.color}` : "1px solid rgba(255,255,255,0.12)",
                    background: selectedDay === d.id ? `${d.color}22` : "rgba(255,255,255,0.05)",
                    color: selectedDay === d.id ? d.color : "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: "'Cairo', sans-serif",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {d.short}
                </button>
              ))}
            </div>
          </div>

          {/* Time (optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", letterSpacing: "0.05em" }}>
              وقت الزيارة (اختياري)
            </label>
            <input
              type="time"
              value={plannedTime}
              onChange={(e) => setPlannedTime(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 13,
                fontFamily: "'Cairo', sans-serif",
                outline: "none",
                width: "fit-content",
              }}
            />
          </div>

          {/* Note (optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif", letterSpacing: "0.05em" }}>
              ملاحظة شخصية (اختياري)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أي ملاحظات للزيارة..."
              dir="rtl"
              rows={2}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 13,
                fontFamily: "'Cairo', sans-serif",
                outline: "none",
                resize: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={addMutation.isPending || selectedBranch === "" || selectedDay === ""}
            style={{
              padding: "12px 0",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #0fa5f8, #0584c7)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'Cairo', sans-serif",
              cursor: "pointer",
              opacity: (selectedBranch === "" || selectedDay === "") ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {addMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            إضافة للجدول
          </button>
        </div>
      )}
    </div>
  );
}

// ── Schedule Entry Card ───────────────────────────────────────────────────────
function ScheduleEntryCard({ entry, onDelete }: { entry: any; onDelete: () => void }) {
  const deleteMutation = trpc.schedule.removeEntry.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الإدخال");
      onDelete();
    },
    onError: (e) => toast.error(e.message),
  });

  const color = DAY_COLORS[entry.dayOfWeek] ?? "#64748b";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 14,
        padding: "14px 16px",
        border: `1px solid ${color}33`,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        position: "relative",
      }}
    >
      {/* Color dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          marginTop: 6,
          flexShrink: 0,
          boxShadow: `0 0 8px ${color}88`,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Branch name */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <MapPin size={13} color="rgba(255,255,255,0.4)" />
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#fff",
              fontFamily: "'Cairo', sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.branchName}
          </span>
        </div>

        {/* Time */}
        {entry.plannedTime && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Clock size={12} color="rgba(255,255,255,0.35)" />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Cairo', sans-serif" }}>
              {entry.plannedTime}
            </span>
          </div>
        )}

        {/* Note */}
        {entry.note && (
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "'Cairo', sans-serif",
              margin: 0,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {entry.note}
          </p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => deleteMutation.mutate({ id: entry.id })}
        disabled={deleteMutation.isPending}
        style={{
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: 8,
          padding: "6px 8px",
          color: "#f87171",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AreaManagerSchedule() {
  const [activeDay, setActiveDay] = useState<number | "all">("all");

  const { data: scheduleEntries = [], refetch } = trpc.schedule.getMySchedule.useQuery(undefined, {
    staleTime: 60_000,
  });

  const { data: branches = [] } = trpc.manager.getMyBranches.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Group entries by day
  const grouped = DAYS.reduce<Record<number, any[]>>((acc, d) => {
    acc[d.id] = (scheduleEntries as any[]).filter((e) => e.dayOfWeek === d.id);
    return acc;
  }, {} as Record<number, any[]>);

  const filteredDays = activeDay === "all"
    ? DAYS
    : DAYS.filter((d) => d.id === activeDay);

  const totalEntries = (scheduleEntries as any[]).length;
  const todayDayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#111417",
        color: "#fff",
        fontFamily: "'Cairo', 'Inter', sans-serif",
        paddingBottom: 100,
        position: "relative",
        overflowX: "hidden",
      }}
      dir="rtl"
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: -80,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: "52px 20px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f122, #6366f144)",
              border: "1.5px solid #6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={22} color="#6366f1" />
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                margin: 0,
                background: "linear-gradient(135deg, #fff 40%, rgba(255,255,255,0.6))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              جدول زياراتي الأسبوعي
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "'Cairo', sans-serif" }}>
              {totalEntries} زيارة مجدولة هذا الأسبوع
            </p>
          </div>
        </div>

        {/* Add Entry Form */}
        <AddEntryForm branches={branches as any[]} onAdded={refetch} />

        {/* Day Filter Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          <button
            onClick={() => setActiveDay("all")}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              border: activeDay === "all" ? "2px solid #fff" : "1px solid rgba(255,255,255,0.15)",
              background: activeDay === "all" ? "rgba(255,255,255,0.1)" : "transparent",
              color: activeDay === "all" ? "#fff" : "rgba(255,255,255,0.4)",
              fontWeight: 700,
              fontSize: 12,
              fontFamily: "'Cairo', sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            الكل
          </button>
          {DAYS.map((d) => {
            const isToday = d.id === todayDayOfWeek;
            const count = grouped[d.id]?.length ?? 0;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDay(d.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  border: activeDay === d.id ? `2px solid ${d.color}` : isToday ? `1px solid ${d.color}66` : "1px solid rgba(255,255,255,0.1)",
                  background: activeDay === d.id ? `${d.color}22` : isToday ? `${d.color}11` : "transparent",
                  color: activeDay === d.id ? d.color : isToday ? d.color : "rgba(255,255,255,0.4)",
                  fontWeight: 700,
                  fontSize: 12,
                  fontFamily: "'Cairo', sans-serif",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {d.short}
                {count > 0 && (
                  <span
                    style={{
                      background: d.color,
                      color: "#fff",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                )}
                {isToday && (
                  <span style={{ fontSize: 10, opacity: 0.7 }}>●</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule content */}
      <div style={{ padding: "0 20px", position: "relative", zIndex: 1 }}>
        {filteredDays.map((day) => {
          const dayEntries = grouped[day.id] ?? [];
          const isToday = day.id === todayDayOfWeek;

          return (
            <div key={day.id} style={{ marginBottom: 24 }}>
              {/* Day Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `${day.color}22`,
                    border: `1.5px solid ${day.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: day.color,
                    fontFamily: "'Cairo', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  {dayEntries.length}
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: isToday ? day.color : "#fff",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {day.label}
                  </span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: day.color,
                        fontFamily: "'Cairo', sans-serif",
                        marginRight: 8,
                        background: `${day.color}22`,
                        border: `1px solid ${day.color}44`,
                        borderRadius: 20,
                        padding: "1px 8px",
                      }}
                    >
                      اليوم
                    </span>
                  )}
                </div>
              </div>

              {/* Entries */}
              {dayEntries.length === 0 ? (
                <div
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: "1px dashed rgba(255,255,255,0.1)",
                    textAlign: "center",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  لا توجد زيارات مجدولة ليوم {day.label}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dayEntries.map((entry: any) => (
                    <ScheduleEntryCard key={entry.id} entry={entry} onDelete={refetch} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {totalEntries === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            <Calendar size={48} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 16px" }} />
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>جدولك فاضي الأسبوع ده</p>
            <p style={{ fontSize: 12, margin: 0 }}>ابدأ بإضافة زيارات لتنظيم أسبوعك الميداني</p>
          </div>
        )}
      </div>
    </div>
  );
}
