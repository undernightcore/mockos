import { int, object } from "zod";

export const sortRouteValidator = object({
  into: int("You must indicate a valid folder").optional(),
  before: int("You must indicate a valid successor route").optional(),
});
