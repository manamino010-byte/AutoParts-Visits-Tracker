import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

export type NotesModalType = "check_in_branch" | "check_in_external" | "check_out_short" | "check_out_general";

// ── أسباب المأمورية الخارجية ──────────────────────────────────────────────────
export const EXTERNAL_MISSION_REASONS = [
  "زيارة عملاء خارجيين",
  "زيارة مراكز خدمة",
  "اجتماع إداري خارجي",
  "متابعة عروض ومشاريع",
  "أخرى",
] as const;

export type ExternalMissionReason = typeof EXTERNAL_MISSION_REASONS[number];

interface NotesModalProps {
  open: boolean;
  type: NotesModalType;
  visitNotes: string;
  onVisitNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

// ── مودال الملاحظات (كان inline في BranchCheckIn — نفس النصوص والسلوك) ──────
// الحالات: دخول فرع / مأمورية خارجية / خروج زيارة قصيرة / خروج عادي
export default function NotesModal({
  open,
  type,
  visitNotes,
  onVisitNotesChange,
  onClose,
  onSubmit,
  isPending,
}: NotesModalProps) {
  const [missionReason, setMissionReason] = useState<ExternalMissionReason | "">("");

  // إعادة تعيين السبب لما المودال يتفتح من جديد
  useEffect(() => {
    if (open && type === "check_in_external") {
      setMissionReason("");
      onVisitNotesChange("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type]);

  // دمج السبب مع الملاحظات وإرسالهم للأعلى
  const handleSubmit = () => {
    if (type === "check_in_external") {
      const combined = missionReason
        ? visitNotes.trim()
          ? `[${missionReason}] - ${visitNotes.trim()}`
          : `[${missionReason}]`
        : visitNotes.trim();
      onVisitNotesChange(combined);
      // نأخر الـ submit فرامة واحدة عشان الـ state يتحدث
      setTimeout(onSubmit, 0);
    } else {
      onSubmit();
    }
  };

  const isSubmitDisabled =
    isPending ||
    (type === "check_in_external" && !missionReason);

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) onClose();
    }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {type === "check_in_external" && "تفاصيل المأمورية الخارجية"}
            {type === "check_in_branch" && "تسجيل زيارة فرع"}
            {type === "check_out_short" && "توضيح سبب الزيارة القصيرة"}
            {type === "check_out_general" && "تسجيل الخروج"}
          </DialogTitle>
          <DialogDescription>
            {type === "check_in_external" && "اختر سبب المأمورية، ثم أضف تفاصيل إضافية إن أردت."}
            {type === "check_in_branch" && "يمكنك كتابة ملاحظات إضافية لهذه الزيارة (اختياري)."}
            {type === "check_out_short" && "مدة الزيارة كانت قصيرة جداً. يجب توضيح السبب لمديرك."}
            {type === "check_out_general" && "هل تريد إضافة ملاحظات عن هذه الزيارة قبل الخروج؟ (اختياري)"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-3">
          {/* ── Dropdown سبب المأمورية (إجباري للمأموريات الخارجية فقط) ── */}
          {type === "check_in_external" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">سبب المأمورية *</label>
              <select
                value={missionReason}
                onChange={(e) => setMissionReason(e.target.value as ExternalMissionReason)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0fa5f8] text-right"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <option value="">— اختر السبب —</option>
                {EXTERNAL_MISSION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── حقل الملاحظات ── */}
          <div className="flex flex-col gap-1.5">
            {type === "check_in_external" && (
              <label className="text-xs font-bold text-muted-foreground">تفاصيل إضافية (اختياري)</label>
            )}
            <Textarea
              placeholder={
                type === "check_in_branch" || type === "check_out_general"
                  ? "ملاحظات اختيارية..."
                  : type === "check_in_external"
                  ? "وجهة، اسم العميل، أي تفاصيل..."
                  : "اكتب التفاصيل هنا..."
              }
              value={visitNotes}
              onChange={(e) => onVisitNotesChange(e.target.value)}
              className="min-h-[100px] resize-none focus-visible:ring-[#0fa5f8]"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full bg-[#0fa5f8] hover:bg-[#0fa5f8]/90 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isPending && <Loader2 className="animate-spin w-5 h-5" />}
            {type === "check_in_branch" ? "تسجيل الدخول الآن" :
             (type === "check_out_short" || type === "check_out_general") ? "تأكيد وتسجيل الخروج" : "بدء المأمورية"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
