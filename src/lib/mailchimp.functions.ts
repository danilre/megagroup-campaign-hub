import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { MailchimpFailure, MailchimpList, PushResult } from "./mailchimp.server";

const memberSchema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  company: z.string().trim().max(200).optional(),
});

const pushSchema = z.object({
  listId: z.string().trim().min(1).max(64),
  status: z.enum(["subscribed", "pending"]).default("pending"),
  members: z.array(memberSchema).min(1).max(500),
});

export const mailchimpPing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ ok: true; account: string } | MailchimpFailure> => {
    const mc = await import("./mailchimp.server");
    try {
      const res = await mc.ping();
      return { ok: true, account: res.account };
    } catch (e) {
      return mc.toMailchimpFailure(e);
    }
  });

export const mailchimpAudiences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ ok: true; lists: MailchimpList[] } | MailchimpFailure> => {
    const mc = await import("./mailchimp.server");
    try {
      return { ok: true, lists: await mc.listAudiences() };
    } catch (e) {
      return mc.toMailchimpFailure(e);
    }
  });

export const mailchimpPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => pushSchema.parse(d))
  .handler(async ({ data }): Promise<PushResult | MailchimpFailure> => {
    const mc = await import("./mailchimp.server");
    try {
      return await mc.pushMembers(data.listId, data.members, data.status);
    } catch (e) {
      return mc.toMailchimpFailure(e);
    }
  });
