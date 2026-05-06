import { object, string } from "zod";

export const createTokenValidator = object({
  name: string("You need a name for the token").min(
    3,
    "The token name must have at least 3 chars"
  ),
});
