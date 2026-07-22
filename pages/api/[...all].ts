import app from "../../server/app";

// Disable Next.js body parsing so that Express can parse bodies and cookies natively
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default app;
