import { int, object, preprocess } from "zod";

export const paginationValidator = object({
  page: preprocess(
    (val) => Number(val),
    int("Page must be a valid integer").min(0, "The first page starts at 0")
  ).default(0),
  pageSize: preprocess(
    (val) => Number(val),
    int("Page size must be a valid integer")
      .min(1, "You should at least require 1 item per page")
      .max(100, "This is paginated for a reason you know")
  ).default(20),
});
