import { object, string } from "zod";

export const loginWithGoogleValidator = object({
  code: string("An authentication code is required"),
});
