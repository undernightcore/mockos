import { email, object, string } from "zod";

export const registerValidator = object({
  name: string("A name is required"),
  email: email("A valid email is required"),
  password: string("Password is required").min(
    8,
    "Password should be at least 8 chars long"
  ),
});
