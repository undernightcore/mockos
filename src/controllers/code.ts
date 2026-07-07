import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { editCodeValidator } from "../validators/code/edit";

export const editCode: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = editCodeValidator.parse(req.body);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const editor = project.members.some(
    (member) =>
      member.userId === user.id &&
      (member.role === "ADMIN" || member.role === "EDITOR")
  );
  if (!editor) throw new HttpError(403, "You are not allowed to edit code");

  const route = await prisma.route.findUnique({
    where: {
      id: Number(req.params.routeId),
      projectId: project.id,
    },
  });
  if (!route) throw new HttpError(404, "Route not found");

  const response = await prisma.response.findUnique({
    where: {
      id: Number(req.params.responseId),
      routeId: route.id,
    },
  });
  if (!response) throw new HttpError(404, "Response not found");

  const processor = await prisma.processor.upsert({
    where: { responseId: response.id },
    update: { ...data },
    create: { ...data, responseId: response.id },
  });

  return res.status(200).json(processor);
};

export const getCode: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const route = await prisma.route.findUnique({
    where: {
      id: Number(req.params.routeId),
      projectId: project.id,
    },
  });
  if (!route) throw new HttpError(404, "Route not found");

  const response = await prisma.response.findUnique({
    where: {
      id: Number(req.params.responseId),
      routeId: route.id,
    },
  });
  if (!response) throw new HttpError(404, "Response not found");

  const processor = await prisma.processor.findUnique({
    where: { responseId: response.id },
  });
  if (!processor) throw new HttpError(404, "The response has no processor.");

  return res.status(200).json(processor);
};
