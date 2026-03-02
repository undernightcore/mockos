import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { createProjectValidator } from "../validators/projects/create";
import { filterValidator } from "../validators/shared/filter";
import { paginationValidator } from "../validators/shared/pagination";

export const listProjects: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const { page, pageSize } = paginationValidator.parse(req.query);
  const { search, orderBy, direction } = filterValidator.parse(req.query);

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where: {
        members: { some: { userId: user.id, verified: true } },
        name: { mode: "insensitive", contains: search },
      },
      orderBy: orderBy ? { [orderBy]: direction } : undefined,
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.project.count({
      where: {
        members: { some: { userId: user.id, verified: true } },
        name: { mode: "insensitive", contains: search },
      },
    }),
  ]);

  return res.status(200).json({
    projects,
    total,
  });
};

export const createProject: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = createProjectValidator.parse(req.body);

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: { ...data, description: data.description || null },
    });

    await tx.members.create({
      data: {
        projectId: created.id,
        userId: user.id,
        verified: true,
        role: "ADMIN",
      },
    });

    return created;
  });

  return res.status(200).json(project);
};

export const editProject: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = createProjectValidator.parse(req.body);

  const existing = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!existing) throw new HttpError(404, "Project not found");

  const admin = existing.members.some(
    (member) => member.userId === user.id && member.role === "ADMIN"
  );
  if (!admin) throw new HttpError(403, "Only the admin can edit a project");

  const updated = await prisma.project.update({
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
    data: { ...data, description: data.description || null },
  });

  return res.status(200).json(updated);
};

export const leaveProject: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const existing = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!existing) throw new HttpError(404, "Project not found");

  if (existing.members.length <= 1) {
    await prisma.project.delete({
      where: {
        id: existing.id,
      },
    });
  } else {
    await prisma.members.deleteMany({
      where: {
        userId: user.id,
        projectId: existing.id,
      },
    });
  }

  return res.status(200).json({ message: "You left the project" });
};
