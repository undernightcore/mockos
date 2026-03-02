import { email, object } from "zod";

export const requestResetValidator = object({
  email: email("A valid email is required"),
});
