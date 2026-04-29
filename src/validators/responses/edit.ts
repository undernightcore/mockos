import { boolean, file, number, object, preprocess, string } from "zod";

export const editResponseValidator = object({
  name: string("A name for the response is required")
    .max(200, "The name cannot be longer that 200 chars")
    .optional(),
  status: preprocess(
    (val) => Number(val),
    number("A status is required")
      .min(100, "The status code cannot be less than 100")
      .max(599, "The status code cannot be more than 599")
  ).optional(),
  enabled: preprocess(
    (val) => String(val) === "true",
    boolean("You must indicate if the response is enabled")
  ).optional(),
  body: string("A body or file is required")
    .or(file("A body or file is required"))
    .optional(),
});
