import "dotenv/config";

import express, { json } from "express";
import info from "../package.json";
import { errorHandler } from "./handlers/error";
import { httpErrorHandler } from "./handlers/http";
import { zodErrorHandler } from "./handlers/zod";
import { getBanner } from "./helpers/banner";
import { authRouter } from "./routes/auth";
import { membersRouter } from "./routes/members";
import { projectsRouter } from "./routes/projects";

const app = express();

app.use(json());

app.use("/auth", authRouter);

app.use("/projects/:projectId/members", membersRouter);
app.use("/projects", projectsRouter);

app.use(zodErrorHandler);
app.use(httpErrorHandler);
app.use(errorHandler);

app.listen(8080, () => console.log(getBanner(info.version)));
