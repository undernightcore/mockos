import { object, string, z } from "zod";

export const importContractValidator = object({
  contract: string("A contract in YAML or JSON format is required"),
  mode: z
    .enum(["OVERRIDE", "MISSING", "MERGE"], "You must indicate the import mode")
    .default("OVERRIDE"),
});
