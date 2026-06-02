import { useConvexAuth } from "@convex-dev/auth/react";
import { Navigate, Route, Routes, useParams } from "react-router";

import { LoginForm } from "@/components/login-form";
import { AppLayout } from "@/components/layout/app-layout";
import { SettingsPage } from "@/components/settings/settings-page";
import { RecipeImportFlow } from "@/components/recipes/import/recipe-import-flow";
import { RecipeListPage } from "@/components/recipes/recipe-list-page";
import { RecipeView } from "@/components/recipes/recipe-view";
import type { Id } from "../convex/_generated/dataModel";

function RecipeViewRoute() {
  const { recipeId } = useParams<{ recipeId: string }>();

  if (!recipeId) {
    return <Navigate to="/" replace />;
  }

  return <RecipeView recipeId={recipeId as Id<"recipes">} />;
}

function AuthenticatedApp() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<RecipeListPage />} />
        <Route path="import" element={<RecipeImportFlow />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="recipes/:recipeId" element={<RecipeViewRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <LoginForm />
      </main>
    );
  }

  return <AuthenticatedApp />;
}

export default App;
