import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

import { HeaderSettingsMenu } from "@/components/layout/header-settings-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "../../../convex/_generated/api";

export function AppLayout() {
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isSettings = location.pathname === "/settings";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex flex-col gap-1">
          <Link
            to="/"
            className="font-heading text-4xl font-semibold tracking-normal"
          >
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
            <Button nativeButton={false} render={<Link to="/import" />}>
              Importer une recette
            </Button>
          ) : (
            <Button nativeButton={false} variant="outline" render={<Link to="/" />}>
              Accueil
            </Button>
          )}
          <div className="hidden items-center gap-2 sm:flex">
            {!isSettings ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label="Paramètres"
                      nativeButton={false}
                      render={<Link to="/settings" />}
                    />
                  }
                >
                  <SettingsIcon />
                </TooltipTrigger>
                <TooltipContent>Paramètres</TooltipContent>
              </Tooltip>
            ) : null}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Se déconnecter"
                    onClick={() => void signOut()}
                  />
                }
              >
                <LogOutIcon />
              </TooltipTrigger>
              <TooltipContent>Se déconnecter</TooltipContent>
            </Tooltip>
          </div>
          <HeaderSettingsMenu />
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 py-6 px-0 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
