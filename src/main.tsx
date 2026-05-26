import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { ThemeProvider } from "@/components/theme-provider.tsx";
import { convex } from "@/lib/convex";

import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ConvexAuthProvider client={convex}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ConvexAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
