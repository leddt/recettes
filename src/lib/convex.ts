import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL n'est pas défini. Lancez `pnpm dev:backend`.");
}

export const convex = new ConvexReactClient(convexUrl);
