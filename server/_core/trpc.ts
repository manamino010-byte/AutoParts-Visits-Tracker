import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// ── Admin Procedure — admin + superadmin ──────────────────────────────────────
// area_manager لا يملك صلاحيات الأدمن
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'admin' && ctx.user.role !== 'superadmin')) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// ── SuperAdmin Procedure — superadmin only ────────────────────────────────────
export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'superadmin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Superadmin access required" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// ── Area Manager Procedure — area_manager فقط (مدير المنطقة) ─────────────────
export const areaManagerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'area_manager' && ctx.user.role !== 'user')) {
      throw new TRPCError({ code: "FORBIDDEN", message: "صلاحية مدير المنطقة مطلوبة" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// ── Branch Manager Procedure — branch_manager فقط (مدير الفرع) ───────────────
export const branchManagerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'branch_manager') {
      throw new TRPCError({ code: "FORBIDDEN", message: "صلاحية مدير الفرع مطلوبة" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// ── Field Manager Procedure — area_manager أو branch_manager (كلاهما يسجل زيارات) ─
export const fieldManagerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const allowed = ['area_manager', 'branch_manager', 'user'];
    if (!ctx.user || !allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "صلاحية مدير ميداني مطلوبة" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
