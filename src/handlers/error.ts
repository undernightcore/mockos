import { ErrorRequestHandler } from "express";
import { logHttp } from "../helpers/log";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  logHttp(500, req.method, req.path, error?.message || "No error provided");
  res.status(500).json({ message: "Something wrong happened." });
};
