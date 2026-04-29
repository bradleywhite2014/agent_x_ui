import { z } from "zod";

import type { WidgetMeta } from "../types";

export const propsSchema = z.object({
  title: z.string().max(80).optional(),
});

export type Props = z.infer<typeof propsSchema>;

export const defaultProps: Props = {
  title: "Middleware & integrations",
};

export const meta: WidgetMeta = {
  slug: "integrations-atlas",
  name: "Integrations Atlas",
  description:
    "Grouped catalog of mocked enterprise/API surfaces (web, email, ERP, CRM, Zendesk, …). Mirrors GET /api/integrations/catalog for composability testing.",
  icon: "layout-grid",
};
