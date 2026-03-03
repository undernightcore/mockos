import { RequestHandler } from "express";
import { HttpError } from "../errors/http";
import { authenticateUser } from "../helpers/auth";
import { prisma } from "../services/prisma";
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
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) => member.userId === user.id && member.role === "ADMIN"
  );
  if (!admin) throw new HttpError(403, "Only the admin can invite new members");

  const invited = await prisma.user.findUnique({
    where: { email: data.email, verified: true },
  });
  if (!invited) throw new HttpError(404, "The user does not exist");

  const alreadyInvited = project.members.some(
    (member) => member.userId === invited.id
  );
  if (alreadyInvited)
    throw new HttpError(400, "The user has already been invited");

  const member = await prisma.members.create({
    data: {
      role: data.role,
      userId: invited.id,
      projectId: project.id,
      verified: false,
    },
  });
  return res.status(200).json(member);
};

export const deleteMember: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) => member.userId === user.id && member.role === "ADMIN"
  );
  if (!admin) throw new HttpError(403, "Only the admin can remove members");

  const exists = project.members.find(
    (member) => member.userId === Number(req.params.memberId)
  );
  if (!exists) throw new HttpError(404, "Member not found");

  await prisma.members.delete({ where: { id: exists.id } });

  return res.status(200).json({ message: "Member removed successfully" });
};

export const editMember: RequestHandler = async (req, res) => {
  const user = await authenticateUser(req);
  const data = editMemberValidator.parse(req.body);

  const project = await prisma.project.findUnique({
    include: { members: true },
    where: {
      id: Number(req.params.projectId),
      members: { some: { userId: user.id, verified: true } },
    },
  });
  if (!project) throw new HttpError(404, "Project not found");

  const admin = project.members.some(
    (member) => member.userId === user.id && member.role === "ADMIN"
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

  return res.status(200).json(member);
};
