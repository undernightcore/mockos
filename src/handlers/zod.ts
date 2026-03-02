import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../errors/http";

export const zodErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  _res,
  next
) => {
  next(
    error instanceof ZodError
      ? new HttpError(400, error.issues[0].message)
      : error
  );
};
