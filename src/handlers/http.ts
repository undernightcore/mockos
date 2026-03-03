import { ErrorRequestHandler } from "express";
import { HttpError } from "../errors/http";
import { logHttp } from "../helpers/log";

export const httpErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
) => {
  if (error instanceof HttpError) {
    logHttp(error.status, req.method, req.path, error.message);
    return res.status(error.status).json({ message: error.message });
  } else {
    next(error);
  }
};
