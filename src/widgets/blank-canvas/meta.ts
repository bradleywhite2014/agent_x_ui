import { z } from "zod";

import type { WidgetMeta } from "../types";

export const propsSchema = z.object({
  title: z.string().max(80).optional(),
});

export type Props = z.infer<typeof propsSchema>;

export const defaultProps: Props = {
  title: "Blank canvas",
};

export const meta: WidgetMeta = {
  slug: "blank-canvas",
  name: "Blank Canvas",
  description:
    "Empty starter surface with lightweight guidance for composing a frame from widgets or agent instructions.",
  icon: "panel-top-open",
};
