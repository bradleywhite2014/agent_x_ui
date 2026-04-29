import { z } from "zod";

import type { WidgetMeta } from "../types";

export const propsSchema = z.object({
  productLabel: z.string().max(48).optional(),
});

export type Props = z.infer<typeof propsSchema>;

export const defaultProps: Props = {
  productLabel: "Console",
};

export const meta: WidgetMeta = {
  slug: "integration-rail",
  name: "Integration Rail",
  description:
    "Left rail with brand slot, mock quick actions, and middleware availability summary. Safe to compose beside notes or previews.",
  icon: "panel-left",
};
