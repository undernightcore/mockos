import { RequestHandler } from "express";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { subscribeToChannel, unsubscribeFromChannel } from "../services/redis";

export const getUserInvitationsRealtime: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const invitations = await prisma.project.findMany({
    where: { members: { some: { userId: user.id, verified: false } } },
  });

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify(invitations)}\n\n`);

  const listener = (message: string) => {
    res.write(`data: ${message}\n\n`);
  };

  res.on("close", () => {
    unsubscribeFromChannel(`invitations:${user.id}`, listener);
  });

  await subscribeToChannel(`invitations:${user.id}`, listener);
};
