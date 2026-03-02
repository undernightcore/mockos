import { email, object, string } from "zod";

export const loginValidator = object({
  email: email("A valid email is required"),
  password: string("Password is required"),
});
