import express from "express";
import cookieParser from "cookie-parser";
import verifyRouter from "./routes/verify";
import categoriesRouter from "./routes/categories";
import votesRouter from "./routes/votes";
import adminWorkersRouter from "./routes/admin-workers";
import adminManageRouter from "./routes/admin-manage";
import adminOverviewRouter from "./routes/admin-overview";
import adminAuthRouter from "./routes/admin-auth";
import adminCategoriesRouter from "./routes/admin-categories";
import adminLogsRouter from "./routes/admin-logs";
import adminUnitsRouter from "./routes/admin-units";
import adminSettingsRouter from "./routes/admin-settings";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/verify", verifyRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/votes", votesRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin/workers", adminWorkersRouter);
app.use("/api/admin/manage", adminManageRouter);
app.use("/api/admin/overview", adminOverviewRouter);
app.use("/api/admin/categories", adminCategoriesRouter);
app.use("/api/admin/logs", adminLogsRouter);
app.use("/api/admin/units", adminUnitsRouter);
app.use("/api/admin/settings", adminSettingsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Express error handler — without this, a thrown/rejected error in a route
// crashes the whole function invocation instead of returning JSON.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
