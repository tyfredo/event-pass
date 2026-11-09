import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "eventpass-api" });
});

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));