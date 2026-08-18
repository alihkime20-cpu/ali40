import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getNewsBySlug, listNews, listRelatedNews } from "./news";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  news: router({
    list: publicProcedure.input(z.object({ category: z.string().optional(), search: z.string().optional(), language: z.enum(["ar", "en"]).optional(), limit: z.number().optional() }).optional()).query(({ input }) => listNews(input || {})),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getNewsBySlug(input.slug)),
    related: publicProcedure.input(z.object({ id: z.number(), category: z.string() })).query(({ input }) => listRelatedNews(input)),
  }),
});

export type AppRouter = typeof appRouter;
