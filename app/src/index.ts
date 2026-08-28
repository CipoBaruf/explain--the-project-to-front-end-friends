import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => {
  console.log(`auto-flow-app listening on :${port} (env: ${process.env.APP_ENV ?? "local"})`);
});
