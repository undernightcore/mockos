import { object, string } from "zod";

export const resetValidator = object({
  token: string("A token is required"),
  password: string("Password is required").min(
    8,
    "Password should be at least 8 chars long"
  ),
});
