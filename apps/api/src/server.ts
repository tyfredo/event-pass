import express from "express";
import { app } from './app'

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));