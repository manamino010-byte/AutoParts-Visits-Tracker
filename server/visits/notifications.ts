import { eq, inArray } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import type { Db } from "./distance";

export async function getManagerName(db: Db, userId: number): Promise<string> {
  const rows = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.name ?? "مدير غير معروف";
}

// ── 🚨 إشعارات الأدمن (fire-and-forget — فشلها لا يوقف العملية الأصلية) ─────
// كل دالة بتبني نفس نص الرسالة الحرفي اللي كان inline في الـ endpoints

// زيارة وهمية وقت check-in فوري
export function notifyMockedCheckIn(managerName: string, locationName: string, isTeleporting: boolean): void {
  notifyOwner({
    title: "🚨 زيارة وهمية مكتشفة",
    content: `المدير: ${managerName}\nالمكان: ${locationName}\nالوقت: ${new Date().toLocaleString("ar-EG")}\n${isTeleporting ? "تم اكتشاف انتقال غير منطقي (Teleportation)" : "تحديد موقع وهمي"}`,
  }).catch(() => {}); // لا نوقف الـ check-in لو فشل الإشعار
}

// زيارة وهمية جاية من مزامنة أوفلاين
export function notifyMockedCheckInOffline(managerName: string, branchName: string, checkInTime: Date, isTeleporting: boolean): void {
  notifyOwner({
    title: "🚨 زيارة وهمية مكتشفة (أوفلاين)",
    content: `المدير: ${managerName}\nالفرع: ${branchName}\nوقت الدخول: ${checkInTime.toLocaleString("ar-EG")}\n${isTeleporting ? "تم اكتشاف انتقال غير منطقي (Teleportation)" : "تحديد موقع وهمي"}`,
  }).catch(() => {});
}

// انتقال وهمي مكتشف وقت الخروج
export function notifyTeleportation(managerName: string, branchName: string | null, distanceKm: number | null, when: Date): void {
  notifyOwner({
    title: "🚨 انتقال وهمي مكتشف (Teleportation)",
    content: `المدير: ${managerName}\nالفرع: ${branchName}\nالمسافة: ${distanceKm?.toFixed(1) ?? "?"} كم\nالوقت: ${when.toLocaleString("ar-EG")}`,
  }).catch(() => {});
}

// زيارة قصيرة مشبوهة (أقل من 3 دقايق) وقت الخروج
export function notifyShortVisit(managerName: string, branchName: string | null, durationMin: number, when: Date): void {
  notifyOwner({
    title: "🚨 زيارة قصيرة مشبوهة",
    content: `المدير: ${managerName}\nالفرع: ${branchName}\nمدة الزيارة: ${Math.round(durationMin * 60)} ثانية فقط\nالوقت: ${when.toLocaleString("ar-EG")}`,
  }).catch(() => {});
}

// ── 📧 إرسال إيميل للأدمن عبر Resend REST API (fire-and-forget) ──────────────
const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_FROM = "onboarding@resend.dev"; // يمكن تغييره لدومين مخصص

async function sendExternalMissionEmail(
  db: Db,
  managerName: string,
  notes: string | undefined,
  lat: number,
  lng: number,
  accuracy: string | undefined,
  when: Date,
): Promise<void> {
  // جيب إيميلات كل المديرين والأدمن الذين لديهم إيميل
  const adminUsers = await db.select({ email: users.email, name: users.name })
    .from(users)
    .where(inArray(users.role, ["admin", "superadmin"]));

  const adminEmails = adminUsers
    .map(u => u.email)
    .filter((e): e is string => !!e && e.length > 0);

  if (adminEmails.length === 0) return;

  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Cairo',Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6d28d9,#4f46e5);padding:28px 32px;">
      <div style="font-size:28px;margin-bottom:8px;">🧭</div>
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">مأمورية خارجية جديدة بانتظار مراجعتك</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">${when.toLocaleString("ar-EG")}</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">اسم المدير</td><td style="padding:6px 0;font-size:13px;font-weight:600;">${managerName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">السبب / الملاحظات</td><td style="padding:6px 0;font-size:13px;">${notes || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">الإحداثيات</td><td style="padding:6px 0;font-size:13px;font-family:monospace;">${lat.toFixed(5)}, ${lng.toFixed(5)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">دقة GPS</td><td style="padding:6px 0;font-size:13px;">${accuracy ?? "—"} م</td></tr>
      </table>
      <!-- Map Button -->
      <div style="margin-top:20px;text-align:center;">
        <a href="${mapsLink}" target="_blank"
           style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;">
          📍 فتح الموقع على الخريطة
        </a>
      </div>
      <p style="margin-top:20px;color:#6b7280;font-size:12px;text-align:center;">
        راجع المأمورية من لوحة تقارير الزيارات وقم بالموافقة ✅ أو الرفض ❌
      </p>
    </div>
  </div>
</body>
</html>`;

  // إرسال لكل الأدمن (fire-and-forget)
  await Promise.allSettled(
    adminEmails.map(email =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [email],
          subject: `🧭 مأمورية خارجية جديدة — ${managerName}`,
          html,
        }),
      }).catch(err => console.error("[Resend] Email failed:", err))
    )
  );
}

// مأمورية خارجية جديدة بانتظار مراجعة الأدمن
export function notifyExternalMissionPending(db: Db, managerName: string, notes: string | undefined, lat: number, lng: number, accuracy: string | undefined, when: Date): void {
  notifyOwner({
    title: "🧭 مأمورية خارجية جديدة بانتظار المراجعة",
    content: `المدير: ${managerName}\nالغرض/الملاحظات: ${notes || "—"}\nالإحداثيات: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nالدقة: ${accuracy || "—"}\nالخريطة: https://maps.google.com/?q=${lat},${lng}\nالوقت: ${when.toLocaleString("ar-EG")}\nراجعها من تقارير الزيارات: موافقة ✅ أو رفض ❌`,
  }).catch(() => {}); // لا نوقف الـ check-in لو فشل الإشعار

  // ✅ إرسال إيميل للأدمن (fire-and-forget)
  sendExternalMissionEmail(db, managerName, notes, lat, lng, accuracy, when)
    .catch(err => console.error("[Resend] sendExternalMissionEmail failed:", err));
}

