import { object, string } from "zod";

export const verifyValidator = object({
  token: string("A token is required"),
});
