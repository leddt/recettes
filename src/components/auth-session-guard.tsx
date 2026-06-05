import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { api } from "../../convex/_generated/api";

type AuthSessionGuardProps = {
  children: React.ReactNode;
};

export function AuthSessionGuard({ children }: AuthSessionGuardProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);

  useEffect(() => {
    if (isLoading || !isAuthenticated || viewer === undefined) {
      return;
    }

    if (viewer === null) {
      void signOut();
    }
  }, [isLoading, isAuthenticated, viewer, signOut]);

  return children;
}
