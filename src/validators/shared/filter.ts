import { object, string, z } from "zod";

export const filterValidator = object({
  search: string("Search must be a valid string").optional(),
  orderBy: string("Order must be a valid field").optional(),
  direction: z
    .enum(["desc", "asc"], "Direction must be 'desc' or 'asc'")
    .optional(),
});
