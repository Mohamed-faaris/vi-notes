import { createApp } from "./app";
import { handleRequest } from "@vercel/express";

const app = createApp();

const handler = handleRequest(app);

export default handler;

if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}
