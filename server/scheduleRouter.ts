import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { areaManagerSchedules, managers, branches } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

// ── Schedule Router — جدولة أسبوعية خاصة بمدراء المناطق فقط ────────────────

export const scheduleRouter = router({
  // GET — جدول الأسبوع الكامل للمدير الحالي
  getMySchedule: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // فقط area_manager (أو "user" القديم) يملك الجدولة
    const allowedRoles = ['area_manager', 'user'];
    if (!allowedRoles.includes(ctx.user!.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "الجدولة متاحة لمدير المنطقة فقط" });
    }

    const managerResult = await db.select({ id: managers.id })
      .from(managers)
      .where(eq(managers.userId, ctx.user!.id))
      .limit(1);

    if (!managerResult[0]) return [];

    const result = await db.select({
      id: areaManagerSchedules.id,
      managerId: areaManagerSchedules.managerId,
      branchId: areaManagerSchedules.branchId,
      dayOfWeek: areaManagerSchedules.dayOfWeek,
      plannedTime: areaManagerSchedules.plannedTime,
      note: areaManagerSchedules.note,
      createdAt: areaManagerSchedules.createdAt,
      // بيانات الفرع للعرض
      branchName: branches.name,
      branchCode: branches.code,
      branchAddress: branches.address,
    }).from(areaManagerSchedules)
      .innerJoin(branches, eq(areaManagerSchedules.branchId, branches.id))
      .where(eq(areaManagerSchedules.managerId, managerResult[0].id))
      .orderBy(areaManagerSchedules.dayOfWeek, areaManagerSchedules.plannedTime);

    return result;
  }),

  // POST — إضافة إدخال جديد في الجدولة
  addEntry: protectedProcedure
    .input(z.object({
      branchId: z.number().int().positive(),
      dayOfWeek: z.number().int().min(0).max(6),
      plannedTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      note: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allowedRoles = ['area_manager', 'user'];
      if (!allowedRoles.includes(ctx.user!.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "الجدولة متاحة لمدير المنطقة فقط" });
      }

      const managerResult = await db.select({ id: managers.id })
        .from(managers)
        .where(eq(managers.userId, ctx.user!.id))
        .limit(1);

      if (!managerResult[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الملف الشخصي للمدير غير موجود" });

      // تحقق من أن الفرع موجود وفعّال
      const branchResult = await db.select({ id: branches.id, name: branches.name })
        .from(branches)
        .where(eq(branches.id, input.branchId))
        .limit(1);
      if (!branchResult[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الفرع غير موجود" });

      await db.insert(areaManagerSchedules).values({
        managerId: managerResult[0].id,
        branchId: input.branchId,
        dayOfWeek: input.dayOfWeek,
        plannedTime: input.plannedTime,
        note: input.note,
      });

      return { success: true };
    }),

  // DELETE — حذف إدخال من الجدولة
  removeEntry: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerResult = await db.select({ id: managers.id })
        .from(managers)
        .where(eq(managers.userId, ctx.user!.id))
        .limit(1);

      if (!managerResult[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الملف الشخصي للمدير غير موجود" });

      // تأكد إن الإدخال تخص هذا المدير
      await db.delete(areaManagerSchedules).where(
        and(
          eq(areaManagerSchedules.id, input.id),
          eq(areaManagerSchedules.managerId, managerResult[0].id),
        )
      );

      return { success: true };
    }),

  // PUT — تعديل ملاحظة أو وقت إدخال موجود
  updateEntry: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      plannedTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
      note: z.string().max(500).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerResult = await db.select({ id: managers.id })
        .from(managers)
        .where(eq(managers.userId, ctx.user!.id))
        .limit(1);

      if (!managerResult[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الملف الشخصي للمدير غير موجود" });

      const updateData: any = {};
      if (input.plannedTime !== undefined) updateData.plannedTime = input.plannedTime;
      if (input.note !== undefined) updateData.note = input.note;

      await db.update(areaManagerSchedules).set(updateData).where(
        and(
          eq(areaManagerSchedules.id, input.id),
          eq(areaManagerSchedules.managerId, managerResult[0].id),
        )
      );

      return { success: true };
    }),
});
