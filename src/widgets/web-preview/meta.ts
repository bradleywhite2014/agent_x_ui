import { z } from "zod";

import type { WidgetMeta } from "../types";

export const propsSchema = z.object({
  title: z.string().max(80).optional(),
  url: z
    .string()
    .url("URL must include a scheme, e.g. https://…")
    .default("https://example.com"),
});

export type Props = z.infer<typeof propsSchema>;

export const defaultProps: Props = {
  title: "Web Preview",
  url: "https://example.com",
};

export const meta: WidgetMeta = {
  slug: "web-preview",
  name: "Web Preview",
  description:
    "Embed a website in an iframe. Sites that refuse iframe embedding fall back to an open-in-new-tab affordance.",
  icon: "globe",
};
