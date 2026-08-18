import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { syncNewsFeeds } from "./news";

export async function scheduledNewsHandler(req: Request, res: Response) {
  const context = { url: req.originalUrl, timestamp: new Date().toISOString() };
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }
    const result = await syncNewsFeeds();
    return res.json({ ok: true, ...result, taskUid: user.taskUid });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message, stack: error instanceof Error ? error.stack : undefined, context });
  }
}
