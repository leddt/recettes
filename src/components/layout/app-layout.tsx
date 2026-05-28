import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Link, Outlet, useLocation } from "react-router";

import { ThemeDropdown } from "@/components/layout/theme-dropdown";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";

export function AppLayout() {
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex flex-col gap-1">
          <Link to="/" className="text-2xl font-semibold tracking-tight">
            Recettes
          </Link>
          {viewer?.name || viewer?.email ? (
            <p className="text-sm text-muted-foreground">
              {viewer.name ?? viewer.email}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {isHome ? (
            <Button render={<Link to="/import" />}>Importer une recette</Button>
          ) : (
            <Button variant="outline" render={<Link to="/" />}>
              Accueil
            </Button>
          )}
          <Button variant="outline" onClick={() => void signOut()}>
            Se déconnecter
          </Button>
          <ThemeDropdown />
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6">
        <Outlet />
      </main>
    </div>
  );
}
