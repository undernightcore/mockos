import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
import { hasChannelSubcribers, sendMessageToChannel } from "../services/redis";
import { editMemberValidator } from "../validators/members/edit";
import { inviteMemberValidator } from "../validators/members/invite";
import { filterValidator } from "../validators/shared/filter";
import { paginationValidator } from "../validators/shared/pagination";

export const getMemberList: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const { page, pageSize } = paginationValidator.parse(req.query);
  const { search } = filterValidator.parse(req.query);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const [members, total] = await prisma.$transaction([
    prisma.members.findMany({
      include: { user: { select: { name: true, email: true } } },
      where: {
        projectId: project.id,
        user: {
          name: { mode: "insensitive", contains: search },
        },
      },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.members.count({
      where: {
        projectId: project.id,
        user: {
          name: { mode: "insensitive", contains: search },
        },
      },
    }),
  ]);

  return res.status(200).json({ members, total });
};

export const inviteMember: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = inviteMemberValidator.parse(req.body);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) =>
      member.userId === user.id && member.role === "ADMIN" && member.verified
  );
  if (!admin) throw new HttpError(403, "Only the admin can invite new members");

  const invited = await prisma.user.findUnique({
    where: { email: data.email, verified: true },
  });
  if (!invited) throw new HttpError(404, "The user does not exist");

  const alreadyInvited = project.members.some(
    (member) => member.userId === invited.id && !member.verified
  );
  if (alreadyInvited)
    throw new HttpError(400, "The user has already been invited");

  const alreadyPart = project.members.some(
    (member) => member.userId === invited.id && member.verified
  );
  if (alreadyPart)
    throw new HttpError(400, "The user is already part of the project");

  const member = await prisma.members.create({
    data: {
      role: data.role,
      userId: invited.id,
      projectId: project.id,
      verified: false,
    },
  });
  res.status(200).json(member);

  // Send realtime
  if (!hasChannelSubcribers(`invitations:${invited.id}`)) return;
  prisma.project
    .findMany({
      where: { members: { some: { userId: invited.id, verified: false } } },
    })
    .then((invitations) =>
      sendMessageToChannel(
        `invitations:${invited.id}`,
        JSON.stringify(invitations)
      )
    )
    .catch(() => undefined);
};

export const deleteMember: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) =>
      member.userId === user.id && member.role === "ADMIN" && member.verified
  );
  if (!admin) throw new HttpError(403, "Only the admin can remove members");

  const exists = project.members.find(
    (member) => member.userId === Number(req.params.memberId)
  );
  if (!exists) throw new HttpError(404, "Member not found");

  await prisma.members.delete({ where: { id: exists.id } });

  res.status(200).json({ message: "Member removed successfully" });

  // Send realtime
  if (exists.verified || !hasChannelSubcribers(`invitations:${exists.id}`))
    return;
  prisma.project
    .findMany({
      where: { members: { some: { userId: exists.id, verified: false } } },
    })
    .then((invitations) =>
      sendMessageToChannel(
        `invitations:${exists.id}`,
        JSON.stringify(invitations)
      )
    )
    .catch(() => undefined);
};

export const editMember: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = editMemberValidator.parse(req.body);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) =>
      member.userId === user.id && member.role === "ADMIN" && member.verified
  );
  if (!admin) throw new HttpError(403, "Only the admin can edit member roles");

  const exists = project.members.find(
    (member) => member.userId === Number(req.params.memberId)
  );
  if (!exists) throw new HttpError(404, "Member not found");

  const member = await prisma.members.update({
    where: { id: exists.id },
    data: { role: data.role },
  });

  res.status(200).json(member);

  if (exists.verified || !hasChannelSubcribers(`invitations:${exists.id}`))
    return;
  prisma.project
    .findMany({
      where: { members: { some: { userId: exists.id, verified: false } } },
    })
    .then((invitations) =>
      sendMessageToChannel(
        `invitations:${exists.id}`,
        JSON.stringify(invitations)
      )
    )
    .catch(() => undefined);
};
