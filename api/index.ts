import app from "../server/app";

// Express's app is itself a valid (req, res) request handler, which is all
// Vercel's Node runtime needs — no adapter package required. Every request
// to /api/* is rewritten to this one function (see vercel.json), and Express
// dispatches internally based on req.url, exactly like it would on any
// normal Node host.
export default app;
