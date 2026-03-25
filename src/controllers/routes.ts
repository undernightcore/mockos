import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import {
  sendMessageToChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
} from "../services/redis";
import { createRouteValidator } from "../validators/routes/create";
import {
  editFolderValidator,
  editRouteValidator,
} from "../validators/routes/edit";
import { sortRouteValidator } from "../validators/routes/sort";

export const getRoutes: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const routes = await prisma.route.findMany({
    include: { children: { orderBy: { order: "asc" } } },
    where: { projectId: project.id, parentFolderId: null },
    orderBy: { order: "asc" },
  });

  res.status(200).json(routes);
};

export const getRoutesRealtime: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const routes = await prisma.route.findMany({
    include: { children: { orderBy: { order: "asc" } } },
    where: { projectId: project.id, parentFolderId: null },
    orderBy: { order: "asc" },
  });

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify(routes)}\n\n`);

  const listener = (message: string) => {
    res.write(`data: ${message}\n\n`);
  };

  res.on("close", () => {
    unsubscribeFromChannel(`project:${project.id}`, listener);
  });

  await subscribeToChannel(`project:${project.id}`, listener);
};

export const createRoute: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = createRouteValidator.parse(req.body);

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
  if (!editor) throw new HttpError(403, "You are not allowed to create routes");

  const existing = !data.folder
    ? await prisma.route.findFirst({
        where: {
          projectId: project.id,
          endpoint: data.endpoint,
          method: data.method,
        },
      })
    : undefined;
  if (existing)
    throw new HttpError(
      409,
      "A route with that endpoint and method already exists"
    );

  const insideAFolder = !data.folder && data.parentFolderId;
  const created = await prisma.$transaction(
    insideAFolder
      ? async (tx) => {
          const route = await tx.route.findUnique({
            include: { children: { orderBy: { order: "asc" } } },
            where: { id: data.parentFolderId, projectId: project.id },
          });

          if (!route) throw new HttpError(404, "The folder does not exist");

          const last = route.children.at(-1)?.order ?? route.order;

          await tx.route.updateMany({
            where: { projectId: project.id, order: { gt: last } },
            data: { order: { increment: 1 } },
          });

          return await tx.route.create({
            data: {
              name: data.name,
              enabled: data.enabled,
              endpoint: data.endpoint,
              parentFolderId: data.parentFolderId,
              folder: false,
              order: last + 1,
              projectId: project.id,
            },
          });
        }
      : async (tx) => {
          const lastRoute = await tx.route.findFirst({
            where: { projectId: project.id },
            orderBy: { order: "asc" },
          });

          return await tx.route.create({
            data: {
              name: data.name,
              enabled: data.folder ? true : data.enabled,
              endpoint: data.folder ? undefined : data.endpoint,
              folder: data.folder,
              order: (lastRoute?.order ?? 0) + 1,
              projectId: project.id,
            },
          });
        },
    {
      isolationLevel: "Serializable",
    }
  );

  res.status(200).json(created);

  // Send to realtime
  prisma.route
    .findMany({
      include: { children: { orderBy: { order: "asc" } } },
      where: { projectId: project.id, parentFolderId: null },
      orderBy: { order: "asc" },
    })
    .then((routes) =>
      sendMessageToChannel(`project:${project.id}`, JSON.stringify(routes))
    )
    .catch();
};

export const editRoute: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

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
  if (!editor) throw new HttpError(403, "You are not allowed to edit routes");

  const route = await prisma.route.findUnique({
    where: { id: Number(req.params.routeId), projectId: project.id },
  });
  if (!route) throw new HttpError(404, "Route not found");

  const edited = route.folder
    ? await prisma.route.update({
        where: { id: route.id },
        data: editFolderValidator.parse(req.body),
      })
    : await prisma.route.update({
        where: { id: route.id },
        data: editRouteValidator.parse(req.body),
      });

  res.status(200).json(edited);

  // Send to realtime
  prisma.route
    .findMany({
      include: { children: { orderBy: { order: "asc" } } },
      where: { projectId: project.id, parentFolderId: null },
      orderBy: { order: "asc" },
    })
    .then((routes) =>
      sendMessageToChannel(`project:${project.id}`, JSON.stringify(routes))
    )
    .catch();
};

export const sortRoute: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = sortRouteValidator.parse(req.body);

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
  if (!editor) throw new HttpError(403, "You are not allowed to sort routes");

  await prisma.$transaction(
    async (tx) => {
      const route = await tx.route.findUnique({
        include: { children: { orderBy: { order: "asc" } } },
        where: { id: Number(req.params.routeId), projectId: project.id },
      });
      if (!route) throw new HttpError(404, "Route not found");

      if (data.into) {
        // When introducing something into a folder
        if (route.folder)
          throw new HttpError(400, "You cannot introduce folders into folders");

        await tx.route.updateMany({
          where: { projectId: project.id, order: { gt: route.order } },
          data: { order: { decrement: 1 } },
        });

        const folder = await tx.route.findUnique({
          include: { children: { orderBy: { order: "asc" } } },
          where: { id: data.into, projectId: project.id, folder: true },
        });

        if (!folder)
          throw new HttpError(
            404,
            "The folder you are trying to put the route into does not exist"
          );

        const before = data.before
          ? await tx.route.findUnique({
              where: {
                id: data.before,
                projectId: project.id,
                parentFolderId: folder.id,
              },
            })
          : undefined;
        if (data.before && !before)
          throw new HttpError(404, "The route that comes after was not found");

        const last = before
          ? before.order - 1
          : folder.children.at(-1)?.order ?? folder.order;

        await tx.route.updateMany({
          where: {
            projectId: project.id,
            order: { gt: last },
            id: {
              not: route.id,
            },
          },
          data: { order: { increment: 1 } },
        });

        await tx.route.update({
          where: { id: route.id },
          data: { order: last + 1 },
        });
      } else {
        // When not introduced into a folder
        await tx.route.updateMany({
          where: {
            projectId: project.id,
            order: { gt: route.children.at(-1)?.order ?? route.order },
          },
          data: { order: { decrement: (route.children.length ?? 0) + 1 } },
        });

        const before = data.before
          ? await tx.route.findUnique({
              where: {
                id: data.before,
                projectId: project.id,
                parentFolderId: null,
              },
            })
          : undefined;
        if (data.before && !before)
          throw new HttpError(404, "The route that comes after was not found");

        const lastRoute = await tx.route.findFirst({
          where: {
            projectId: project.id,
            id: {
              notIn: [route.id, ...route.children.map((child) => child.id)],
            },
          },
          orderBy: { order: "asc" },
        });

        const last = before ? before.order - 1 : lastRoute?.order ?? 0;

        await tx.route.updateMany({
          where: {
            projectId: project.id,
            order: { gt: last },
            id: {
              notIn: [route.id, ...route.children.map((child) => child.id)],
            },
          },
          data: { order: { increment: (route.children.length ?? 0) + 1 } },
        });

        await tx.route.updateMany({
          where: {
            id: { in: [route.id, ...route.children.map((child) => child.id)] },
          },
          data: { order: { increment: last + 1 - route.order } },
        });
      }
    },
    {
      isolationLevel: "Serializable",
    }
  );

  return res.status(200).json({ message: "Sorted successfully!" });
};

export const deleteRoute: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

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
  if (!editor) throw new HttpError(403, "You are not allowed to delete routes");

  await prisma.$transaction(
    async (tx) => {
      const route = await tx.route.findUnique({
        where: { id: Number(req.params.routeId), projectId: project.id },
      });
      if (!route) throw new HttpError(404, "Route not found");

      await tx.route.delete({ where: { id: route.id } });

      await tx.route.updateMany({
        where: {
          projectId: project.id,
          order: { gt: route.order },
        },
        data: { order: { decrement: 1 } },
      });
    },
    { isolationLevel: "Serializable" }
  );

  return res.status(200).json({ message: "Deleted succesfully!" });
};
