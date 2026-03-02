import { email, object, z } from "zod";

export const inviteMemberValidator = object({
  email: email("A valid email is required"),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"], "A valid role is required"),
});
