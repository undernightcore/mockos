import { boolean, object, string } from "zod";

export const editCodeValidator = object({
  code: string("Code is required for the processor"),
  enabled: boolean("You must indicate if you want it to be enabled"),
});
