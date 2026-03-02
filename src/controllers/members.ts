import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { inviteMemberValidator } from "../validators/members/invite";

export const inviteMember: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = inviteMemberValidator.parse(req.body);

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
  if (!admin) throw new HttpError(403, "Only the admin can invite new members");

  const invited = await prisma.user.findUnique({
    where: { email: data.email, verified: true },
  });
  if (!invited) throw new HttpError(400, "The user does not exist");

  const alreadyInvited = existing.members.some(
    (member) => member.userId === invited.id
  );
  if (alreadyInvited)
    throw new HttpError(200, "The user has already been invited");

  const member = await prisma.members.create({
    data: {
      role: data.role,
      userId: invited.id,
      projectId: existing.id,
      verified: false,
    },
  });
  return res.status(200).json(member);
};
