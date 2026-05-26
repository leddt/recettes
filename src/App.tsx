import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router";

import { LoginForm } from "@/components/login-form";
import { RecipeImportFlow } from "@/components/recipe-import-flow";
import { RecipeView } from "@/components/recipe-view";
import { Button } from "@/components/ui/button";
import { formatRecipeSummary } from "@/lib/recipe-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

function RecipeListPage() {
  const recipes = useQuery(api.recipes.list);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Vos recettes</CardTitle>
          <CardDescription>
            Importez une recette depuis une URL, vérifiez les détails extraits,
            puis enregistrez-la ici.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recipes === undefined ? (
            <p className="text-sm text-muted-foreground">
              Chargement des recettes...
            </p>
          ) : recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune recette enregistrée pour le moment.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recipes.map((recipe) => (
                <li key={recipe._id}>
                  <Link
                    to={`/recipes/${recipe._id}`}
                    className="flex w-full flex-col gap-1 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <p className="font-medium">{recipe.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRecipeSummary(recipe) || "Détails à compléter"}
                    </p>
                    {recipe.tags.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {recipe.tags.join(", ")}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecipeViewRoute() {
  const { recipeId } = useParams<{ recipeId: string }>();

  if (!recipeId) {
    return <Navigate to="/" replace />;
  }

  return <RecipeView recipeId={recipeId as Id<"recipes">} />;
}

function AppLayout() {
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
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6">
        <Outlet />
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<RecipeListPage />} />
        <Route path="import" element={<RecipeImportFlow />} />
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
