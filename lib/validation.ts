import { z } from "zod";
const str = z.string().max(20000).default("");
export const recordSchema = z.object({
  id: z.string().min(1).max(100),
  kind: z.enum(["resource", "task", "schedule"]),
  name: z.string().trim().min(1).max(300),
  type: str,
  business: str,
  priority: z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
  contact: str,
  city: str,
  channel: str,
  opportunity: str,
  owner: z.enum(["我", "老板", "乔伊"]).default("我"),
  status: str,
  planned: z
    .string()
    .refine((s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s))
    .default(""),
  time: z
    .string()
    .regex(/^(|([01]\d|2[0-3]):[0-5]\d)$/)
    .default(""),
  category: z.string().max(100).default("其他事项"),
  attendees: str,
  topic: str,
  deadline: z
    .string()
    .refine((s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s))
    .default(""),
  resourceId: str,
  resourceIds: z.array(z.string().max(100)).max(100).default([]),
  scheduleIds: z.array(z.string().max(100)).max(100).default([]),
  source: str,
  verified: z.boolean().default(false),
  notes: z
    .array(
      z.object({
        text: z.string().max(20000),
        at: z.string().datetime(),
        by: z.string().max(100),
      }),
    )
    .max(1000)
    .default([]),
  links: z
    .array(
      z.object({
        id: z.string().max(100),
        title: z.string().min(1).max(300),
        url: z
          .string()
          .url()
          .max(4000)
          .refine((v) => /^https?:\/\//i.test(v), "仅支持 http/https 链接"),
        kind: z.string().max(100),
        addedAt: z.string().datetime(),
      }),
    )
    .max(500)
    .default([]),
  revision: z.number().int().min(0),
});
