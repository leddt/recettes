import { useConvexAuth, useConvexConnectionState } from "convex/react";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";

const OVERLAY_DELAY_MS = 250;

export function ConvexReconnectOverlay() {
  const { isAuthenticated, isLoading, isRefreshing } = useConvexAuth();
  const { isWebSocketConnected, hasEverConnected } = useConvexConnectionState();

  const isReconnecting = hasEverConnected && !isWebSocketConnected;
  const shouldShow =
    isAuthenticated && !isLoading && (isRefreshing || isReconnecting);

  const [showAfterDelay, setShowAfterDelay] = useState(false);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowAfterDelay(true);
    }, OVERLAY_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
      setShowAfterDelay(false);
    };
  }, [shouldShow]);

  if (!shouldShow || !showAfterDelay) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Reconnexion en cours"
    >
      <Spinner className="size-8" />
    </div>
  );
}
