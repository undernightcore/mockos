import { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_, res) =>
  res.status(404).json({ message: "Not found" });
