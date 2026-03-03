import z, { object } from "zod";

export const editMemberValidator = object({
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});
