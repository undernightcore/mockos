import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { convertContractToRoutes } from "../helpers/swagger";
import { prisma } from "../services/prisma";
import { sendMessageToChannel } from "../services/redis";
import { importContractValidator } from "../validators/contracts/import";

export const importContract: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const { contract, mode } = importContractValidator.parse(req.body);
  const api = await convertContractToRoutes(contract);
  const mappedApi = new Map(
    api.map((route) => [`${route.method}-${route.path}`, route])
  );

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
  if (!editor)
    throw new HttpError(403, "You are not allowed to import contracts");

  switch (mode) {
    case "OVERRIDE":
      await prisma.$transaction(async (trx) => {
        await trx.route.deleteMany({ where: { projectId: project.id } });

        const routes = await trx.route.createManyAndReturn({
          data: api.map((route, i) => ({
            enabled: true,
            name: route.name,
            order: i + 1,
            projectId: project.id,
            endpoint: route.path,
            method: route.method,
            folder: false,
          })),
        });

        await trx.response.createMany({
          data: routes.flatMap(
            (route) =>
              mappedApi
                .get(`${route.method}-${route.endpoint}`)
                ?.responses.map((response, i) => ({
                  name: response.name,
                  status: response.code,
                  file: false,
                  enabled: i === 0,
                  routeId: route.id,
                  body: response.example ?? "",
                })) ?? []
          ),
        });
      });
      break;
    case "MISSING":
      break;
    case "MERGE":
      break;
  }

  res
    .status(200)
    .json({ message: "The contract has been succesfully imported" });

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
    .catch(() => undefined);
};
