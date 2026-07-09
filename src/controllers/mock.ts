import { RequestHandler } from "express";
import { match, MatchFunction } from "path-to-regexp";
import { HttpError } from "../errors/http";
import { prisma } from "../services/prisma";
import { getFile } from "../services/s3";
import { executeUntrustedCode } from "../services/vm";

export const useMock: RequestHandler = async (req, res) => {
  const path = "/" + ((req.params.route as string[]) ?? []).join("/");

  const token = await prisma.token.findUnique({
    where: { token: String(req.params.token) },
  });
  if (!token) throw new HttpError(401, "Invalid token");

  const routes = await prisma.route.findMany({
    where: {
      projectId: token.projectId,
      endpoint: { not: null },
    },
    orderBy: { order: "asc" },
  });

  const found = routes.find(
    (route) =>
      route.method === req.method &&
      match(String(route.endpoint).replaceAll("{", ":").replaceAll("}", ""))(
        path
      )
  );
  if (!found)
    throw new HttpError(404, "Route not found with that endpoint and method");

  const response = await prisma.response.findFirst({
    where: { routeId: found.id, enabled: true },
    include: { headers: true },
  });
  if (!response)
    throw new HttpError(404, "No enabled response found for that endpoint");

  const file = response.file
    ? await getFile(response.body).then((file) =>
        file?.Body?.transformToByteArray()
      )
    : undefined;

  const code = !file
    ? await prisma.processor.findUnique({ where: { responseId: response.id } })
    : undefined;

  res.setHeaders(
    new Headers(
      Object.fromEntries(
        response.headers.map((header) => [header.key, header.value])
      )
    )
  );

  if (file) {
    if (!res.getHeader("content-type"))
      res.setHeader("content-type", "application/octet-steam");

    return res.status(200).send(file);
  } else if (code) {
    if (!res.getHeader("content-type"))
      res.setHeader("content-type", "application/json");

    const { params } = match(
      String(found.endpoint).replaceAll("{", ":").replaceAll("}", "")
    )(path) as Exclude<ReturnType<MatchFunction<{}>>, false>;

    try {
      const result = await executeUntrustedCode(code.code, {
        params,
        queryParams: req.query ?? {},
        content: response.body,
        url: path,
        headers: req.headers,
      });

      return res.status(200).send(result);
    } catch (e) {
      throw new HttpError(400, `Custom code is throwing errors: ${e.message}`);
    }
  } else {
    if (!res.getHeader("content-type"))
      res.setHeader("content-type", "application/json");

    return res.status(200).send(response.body);
  }
};
