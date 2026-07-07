import { boolean, object, string } from "zod";

export const editCodeValidator = object({ code: string(), enabled: boolean() });
