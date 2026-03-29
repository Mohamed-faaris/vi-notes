declare module "@vercel/express" {
  import { Application } from "express";
  export function handleRequest(app: Application): (req: unknown, res: unknown) => Promise<void>;
}
