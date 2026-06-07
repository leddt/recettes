import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { registerSW } from "virtual:pwa-register";

import { ConvexReconnectOverlay } from "@/components/convex-reconnect-overlay";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { convex } from "@/lib/convex";

import "./index.css";
import App from "./App.tsx";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <ConvexAuthProvider client={convex}>
        <ThemeProvider>
          <TooltipProvider>
            <App />
            <ConvexReconnectOverlay />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </ConvexAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
