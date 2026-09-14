import { eq, and, gte, lt, desc } from "drizzle-orm";
import { getDb } from "../db";
import { visits, branches } from "../../drizzle/schema";
import { getDistanceMeters } from "../../shared/utils";
import { getBranchDistance } from "../../shared/gizaBranchDistances";

// type الـ db الأساسي — transaction من نفس النوع (getDb يرجّع drizzle mysql2 instance)
export type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

// ── دالة مساعدة: احسب المسافة من الفرع السابق (أي زيارة مكتملة في نفس اليوم) ─
// ✅ استراتيجية مزدوجة:
//    ① مصفوفة المسافات المعتمدة من الشيت (أدق — مسافات طرق فعلية)
//    ② Fallback Haversine بين إحداثيات الفرعين (خط مستقيم — تقريب كافٍ
//       لكشف الغش) مع تاج DIST_HAVERSINE_ESTIMATE عشان الأدمن يعرف المصدر
export async function calcDistanceFromPrevBranch(
  db: Db,
  managerId: number,
  currentBranchName: string,
  currentLat: number | undefined,
  currentLng: number | undefined,
  referenceTime: Date,
): Promise<{ km: number; prevBranchName: string; timeDiffMin: number; estimated: boolean } | null> {
  const dayStart = new Date(referenceTime);
  dayStart.setHours(0, 0, 0, 0);

  // ✅ Bug Fix: leftJoin بدل innerJoin عشان المأموريات الخارجية (branchId=null) تظهر كزيارة سابقة
  // innerJoin القديم كان بيتجاهلهم → المسافة كانت بتتحسب من الفرع اللي قبل المأمورية مش منها
  const prevVisits = await db.select({
    branchName: branches.name,
    latitude: branches.latitude,
    longitude: branches.longitude,
    latitudeIn:  visits.latitudeIn,   // ✅ موقع دخول المأمورية الخارجية (Fallback)
    longitudeIn: visits.longitudeIn,
    checkInAt:  visits.checkInAt,
    checkOutAt: visits.checkOutAt,
  }).from(visits)
    .leftJoin(branches, eq(visits.branchId, branches.id))
    .where(and(
      eq(visits.managerId, managerId),
      eq(visits.status, "checked_out"),
      gte(visits.checkInAt, dayStart),
      lt(visits.checkInAt, referenceTime), // قبل الزيارة الحالية فقط
    ))
    .orderBy(desc(visits.checkInAt))
    .limit(1);

  if (!prevVisits[0]?.checkOutAt) return null;

  const prev = prevVisits[0];
  // ✅ لو الزيارة السابقة مأمورية خارجية (branchName = null) → نعرّفها بالاسم الوصفي
  const prevBranchName = prev.branchName ?? "مأمورية خارجية";

  // ① الأولوية للمصفوفة المعتمدة (تشتغل فقط لو الزيارة السابقة فرع معروف)
  let km = prev.branchName ? getBranchDistance(prev.branchName, currentBranchName) : null;
  let estimated = false;

  // ② Fallback: خط مستقيم — للفروع غير الموجودة في المصفوفة وللمأموريات الخارجية
  if (km === null && currentLat !== undefined && currentLng !== undefined) {
    // للفروع: إحداثيات الفرع نفسه. للمأموريات الخارجية: موقع الدخول المسجل
    const prevLat = prev.latitude ? parseFloat(prev.latitude)
      : (prev.latitudeIn ? parseFloat(prev.latitudeIn) : undefined);
    const prevLng = prev.longitude ? parseFloat(prev.longitude)
      : (prev.longitudeIn ? parseFloat(prev.longitudeIn) : undefined);

    if (prevLat !== undefined && prevLng !== undefined) {
      const meters = getDistanceMeters(
        prevLat, prevLng,
        currentLat, currentLng
      );
      km = Math.round(meters / 100) / 10; // تقريب لأقرب 100 متر
      estimated = true;
    }
  }

  if (km === null) {
    console.warn(`[Distances] No distance source for: "${prevBranchName}" → "${currentBranchName}"`);
    return null;
  }

  const timeDiffMin = (referenceTime.getTime() - (prev.checkOutAt as Date).getTime()) / 60_000;

  return { km, prevBranchName, timeDiffMin, estimated };

}

// ── دالة مساعدة: هل الانتقال مستحيل؟ (Teleportation check) ─────────────────
export function isTeleportation(km: number, timeDiffMin: number): boolean {
  if (timeDiffMin <= 0) return true; // مستحيل فيزيائياً
  const speedKmh = km / (timeDiffMin / 60);
  // أكثر من 80 كم/ساعة في وسط القاهرة والجيزة → مستحيل
  return speedKmh > 80;
}

// ── الدالة الموحدة لفحص الانتقال من آخر زيارة (كانت منسوخة 3 مرات) ──────────
// بتستخدمها: checkIn + syncOfflineVisits + finalizeCheckOut
// بتجيب المسافة من الفرع السابق وبتحدد Teleportation + السبب الجاهز للتسجيل
export interface TravelCheckResult {
  isTeleporting: boolean;
  teleportReason: string | null;
  km: number | null;
  timeDiffMin: number | null;
  estimated: boolean;
}

export async function checkTravelFromPrevBranch(
  db: Db,
  managerId: number,
  destBranchName: string,
  destLat: number | undefined,
  destLng: number | undefined,
  referenceTime: Date,
): Promise<TravelCheckResult> {
  const prevResult = await calcDistanceFromPrevBranch(
    db, managerId, destBranchName, destLat, destLng, referenceTime
  );
  if (prevResult === null) {
    return { isTeleporting: false, teleportReason: null, km: null, timeDiffMin: null, estimated: false };
  }

  const { km, prevBranchName, timeDiffMin, estimated } = prevResult;
  const teleporting = isTeleportation(km, timeDiffMin);
  const speedKmh = Math.round(km / (timeDiffMin / 60));
  const teleportReason = teleporting
    ? `TELEPORTATION:${prevBranchName}→${destBranchName}:${km.toFixed(1)}km:${Math.round(timeDiffMin)}min:${speedKmh}kmh`
    : null;

  return { isTeleporting: teleporting, teleportReason, km, timeDiffMin, estimated };
}
