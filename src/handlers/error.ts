import { ErrorRequestHandler } from "express";
import { logHttp } from "../helpers/log";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  logHttp(500, error?.message || "No error provided");
  res.status(500).json({ message: "Something wrong happened." });
};
