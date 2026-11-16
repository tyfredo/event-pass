// apps/api/src/server.ts
import 'dotenv/config';
import { app } from './app';

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));