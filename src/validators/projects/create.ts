import { object, string } from "zod";

export const createProjectValidator = object({
  name: string("A project name is required").min(
    1,
    "The project name should at least be 1 char long"
  ),
  description: string("A valid project description is required")
    .min(1, "The project description should at least be 1 char long")
    .optional(),
});
