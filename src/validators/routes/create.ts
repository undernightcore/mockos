import z, { boolean, int, literal, object, string } from "zod";

export const createRouteValidator = object({
  name: string("A name is required"),
  method: z.enum(
    ["GET", "POST", "DELETE", "PATCH", "PUT"],
    "A valid method for your route is required"
  ),
  endpoint: string("An route must include an endpoint").regex(
    /^\/([a-zA-Z0-9{}_-]+)*(\/[a-zA-Z0-9{}_-]+)*$/,
    "The endpoint MUST start with / and not end with /"
  ),
  folder: literal(false),
  parentFolderId: int("The parent folder must be a number").optional(),
  enabled: boolean("You must indicate if the route is enabled"),
}).or(
  object({
    name: string(),
    folder: literal(true),
  })
);
