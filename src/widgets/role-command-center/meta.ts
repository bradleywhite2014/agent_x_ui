import { z } from "zod";

import type { DashboardPersona } from "@/lib/integrations/mock-results";
import type { WidgetMeta } from "../types";

export const propsSchema = z.object({
  persona: z
    .enum(["finance", "support", "operations", "general"])
    .default("general"),
  title: z.string().max(80).optional(),
});

export type Props = z.infer<typeof propsSchema>;

export const defaultProps: Props = {
  persona: "general" satisfies DashboardPersona,
  title: "Command center",
};

export const meta: WidgetMeta = {
  slug: "role-command-center",
  name: "Role Dashboard",
  description:
    "Persona-specific mocked operating dashboard with metrics, charts, work queue, and connected-system feed.",
  icon: "chart-no-axes-combined",
};
