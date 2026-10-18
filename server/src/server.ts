import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`[server] listening on http://localhost:${env.port}`);
});
