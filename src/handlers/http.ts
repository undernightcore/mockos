import { ErrorRequestHandler } from "express";
import { HttpError } from "../errors/http";
import { logHttp } from "../helpers/log";

export const httpErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next
) => {
  if (error instanceof HttpError) {
    logHttp(error.status, error.message);
    return res.status(error.status).json({ message: error.message });
  } else {
    next(error);
  }
};
