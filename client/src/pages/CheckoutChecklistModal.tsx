import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, X, Star, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChecklistData {
  uniform: number;
  collections: boolean;
  inventoryCount: boolean;
  cleanliness: number;
  transfers: boolean;
  transfersRating?: number;
  shortages: boolean;
  shortageItems?: string[];
  audit: boolean;
}

interface CheckoutChecklistModalProps {
  open: boolean;
  visitId: number | null;
  branchName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex flex-col gap-1.5">
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "rgba(255,255,255,0.6)",
          fontFamily: "'Cairo', sans-serif",
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "transform 0.15s",
                transform: filled ? "scale(1.15)" : "scale(1)",
              }}
            >
              <Star
                size={28}
                fill={filled ? "#f59e0b" : "transparent"}
                stroke={filled ? "#f59e0b" : "rgba(255,255,255,0.25)"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#f59e0b",
              alignSelf: "center",
              marginRight: 4,
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}

// ── Binary Toggle Component ───────────────────────────────────────────────────
function BinaryToggle({
  value,
  onChange,
  label,
  icon,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  label: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "rgba(255,255,255,0.6)",
          fontFamily: "'Cairo', sans-serif",
          letterSpacing: "0.03em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon && (
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {icon}
          </span>
        )}
        {label}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 12,
            border: value === true ? "2px solid #34d399" : "1px solid rgba(255,255,255,0.12)",
            background: value === true ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
            color: value === true ? "#34d399" : "rgba(255,255,255,0.5)",
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "'Cairo', sans-serif",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <CheckCircle2 size={16} />
          نعم
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 12,
            border: value === false ? "2px solid #f87171" : "1px solid rgba(255,255,255,0.12)",
            background: value === false ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.05)",
            color: value === false ? "#f87171" : "rgba(255,255,255,0.5)",
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "'Cairo', sans-serif",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <XCircle size={16} />
          لا
        </button>
      </div>
    </div>
  );
}

// ── Shortages Dynamic List ────────────────────────────────────────────────────
function ShortagesList({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setNewItem("");
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div
      style={{
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.2)",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#f87171",
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        ⚠ أدخل الأصناف الناقصة
      </span>

      {/* Existing items */}
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            {item}
          </span>
          <button
            type="button"
            onClick={() => removeItem(idx)}
            style={{
              background: "none",
              border: "none",
              color: "#f87171",
              cursor: "pointer",
              padding: 2,
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {/* Add new item */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="اسم الصنف الناقص..."
          dir="rtl"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "8px 12px",
            color: "#fff",
            fontSize: 13,
            fontFamily: "'Cairo', sans-serif",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={addItem}
          style={{
            background: "rgba(248,113,113,0.2)",
            border: "1px solid rgba(248,113,113,0.3)",
            borderRadius: 10,
            padding: "8px 12px",
            color: "#f87171",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontFamily: "'Cairo', sans-serif",
            fontWeight: 700,
          }}
        >
          <Plus size={14} />
          إضافة
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function CheckoutChecklistModal({
  open,
  visitId,
  branchName,
  onClose,
  onSuccess,
}: CheckoutChecklistModalProps) {
  const [uniform, setUniform] = useState(0);
  const [collections, setCollections] = useState<boolean | null>(null);
  const [inventoryCount, setInventoryCount] = useState<boolean | null>(null);
  const [cleanliness, setCleanliness] = useState(0);
  const [transfers, setTransfers] = useState<boolean | null>(null);
  const [transfersRating, setTransfersRating] = useState(0);
  const [shortages, setShortages] = useState<boolean | null>(null);
  const [shortageItems, setShortageItems] = useState<string[]>([]);
  const [audit, setAudit] = useState<boolean | null>(null);

  const submitMutation = trpc.visit.submitCheckoutChecklist.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حفظ تقرير الزيارة بنجاح");
      onSuccess();
    },
    onError: (err) => {
      toast.error(`❌ خطأ في حفظ التقرير: ${err.message}`);
    },
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setUniform(0);
      setCollections(null);
      setInventoryCount(null);
      setCleanliness(0);
      setTransfers(null);
      setTransfersRating(0);
      setShortages(null);
      setShortageItems([]);
      setAudit(null);
    }
  }, [open]);

  // Validate all required fields filled
  const isValid =
    uniform > 0 &&
    collections !== null &&
    inventoryCount !== null &&
    cleanliness > 0 &&
    transfers !== null &&
    (transfers === false || transfersRating > 0) &&
    shortages !== null &&
    (shortages === false || shortageItems.length > 0) &&
    audit !== null;

  const handleSubmit = () => {
    if (!visitId || !isValid) return;
    submitMutation.mutate({
      visitId,
      uniform,
      collections: collections!,
      inventoryCount: inventoryCount!,
      cleanliness,
      transfers: transfers!,
      ...(transfers ? { transfersRating } : {}),
      shortages: shortages!,
      ...(shortages ? { shortageItems } : {}),
      audit: audit!,
    });
  };

  const completedFields = [
    uniform > 0,
    collections !== null,
    inventoryCount !== null,
    cleanliness > 0,
    transfers !== null && (transfers === false || transfersRating > 0),
    shortages !== null && (shortages === false || shortageItems.length > 0),
    audit !== null,
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitMutation.isPending) onClose(); }}>
      <DialogContent
        className="p-0 overflow-hidden max-w-md border-0"
        style={{
          background: "#13161a",
          borderRadius: 24,
          maxHeight: "92svh",
          display: "flex",
          flexDirection: "column",
        }}
        dir="rtl"
      >
        {/* Header */}
        <DialogHeader
          style={{
            padding: "20px 20px 0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0fa5f822, #0fa5f844)",
                border: "1.5px solid #0fa5f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#0fa5f8" }}>
                fact_check
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DialogTitle
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily: "'Cairo', sans-serif",
                  marginBottom: 2,
                }}
              >
                تقرير الزيارة الإلزامي
              </DialogTitle>
              {branchName && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#0fa5f8",
                    fontFamily: "'Cairo', sans-serif",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {branchName}
                </p>
              )}
            </div>
            {/* Progress indicator */}
            <div
              style={{
                background: "rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 800,
                color: completedFields === 7 ? "#34d399" : "#f59e0b",
                fontFamily: "'Cairo', sans-serif",
                flexShrink: 0,
              }}
            >
              {completedFields}/7
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 3,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 2,
              marginTop: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(completedFields / 7) * 100}%`,
                background: completedFields === 7 ? "#34d399" : "#0fa5f8",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* ── 1. Uniform ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <StarRating value={uniform} onChange={setUniform} label="🧥 الزي الرسمي (Uniform)" />
          </div>

          {/* ── 2. Collections ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <BinaryToggle
              value={collections}
              onChange={setCollections}
              label="💰 التحصيلات (Collections)"
              icon="payments"
            />
          </div>

          {/* ── 3. Inventory Count (جرد) ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <BinaryToggle
              value={inventoryCount}
              onChange={setInventoryCount}
              label="📦 الجرد (Inventory Count)"
              icon="inventory"
            />
          </div>

          {/* ── 4. Branch Cleanliness ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <StarRating value={cleanliness} onChange={setCleanliness} label="🧹 نظافة الفرع (Cleanliness)" />
          </div>

          {/* ── 5. Transfers ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <BinaryToggle
              value={transfers}
              onChange={(v) => {
                setTransfers(v);
                if (!v) setTransfersRating(0);
              }}
              label="🚚 التحويلات (Transfers)"
              icon="local_shipping"
            />
            {transfers === true && (
              <div
                style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <StarRating
                  value={transfersRating}
                  onChange={setTransfersRating}
                  label="⏱ هل تم التسليم في الوقت المحدد؟"
                />
              </div>
            )}
          </div>

          {/* ── 6. Shortages (نواقص) ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <BinaryToggle
              value={shortages}
              onChange={(v) => {
                setShortages(v);
                if (!v) setShortageItems([]);
              }}
              label="⚠ نواقص (Shortages)"
              icon="warning"
            />
            {shortages === true && (
              <ShortagesList items={shortageItems} onChange={setShortageItems} />
            )}
          </div>

          {/* ── 7. Audit ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <BinaryToggle
              value={audit}
              onChange={setAudit}
              label="🔍 المراجعة (Audit)"
              icon="manage_search"
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px 20px",
            flexShrink: 0,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitMutation.isPending}
            style={{
              flex: 1,
              padding: "14px 0",
              borderRadius: 14,
              border: "none",
              background: isValid
                ? "linear-gradient(135deg, #0fa5f8, #0584c7)"
                : "rgba(255,255,255,0.08)",
              color: isValid ? "#fff" : "rgba(255,255,255,0.3)",
              fontWeight: 800,
              fontSize: 15,
              fontFamily: "'Cairo', sans-serif",
              cursor: isValid ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitMutation.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                check_circle
              </span>
            )}
            {submitMutation.isPending ? "جاري الحفظ..." : "حفظ التقرير"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
