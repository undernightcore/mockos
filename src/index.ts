import "dotenv/config";

import express, { json } from "express";
import info from "../package.json";
import { notFoundHandler } from "./handlers/404";
import { errorHandler } from "./handlers/error";
import { httpErrorHandler } from "./handlers/http";
import { zodErrorHandler } from "./handlers/zod";
import { getBanner } from "./helpers/banner";
import { authRouter } from "./routes/auth";
import { codeRouter } from "./routes/code";
import { contractsRouter } from "./routes/contracts";
import { membersRouter } from "./routes/members";
import { mockRouter } from "./routes/mock";
import { projectsRouter } from "./routes/projects";
import { responsesRouter } from "./routes/responses";
import { routesRouter } from "./routes/routes";
import { tokensRouter } from "./routes/tokens";

const app = express();

app.use(json());

app.use("/auth", authRouter);

app.use(
  "/projects/:projectId/routes/:routeId/responses/:responseId/code",
  codeRouter
);
app.use("/projects/:projectId/routes/:routeId/responses", responsesRouter);
app.use("/projects/:projectId/routes", routesRouter);
app.use("/projects/:projectId/members", membersRouter);
app.use("/projects/:projectId/tokens", tokensRouter);
app.use("/projects/:projectId/contracts", contractsRouter);
app.use("/projects", projectsRouter);
app.use("/mock", mockRouter);

app.use(notFoundHandler);
app.use(zodErrorHandler);
app.use(httpErrorHandler);
app.use(errorHandler);

app.listen(8080, () => console.log(getBanner(info.version)));
