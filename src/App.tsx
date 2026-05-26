import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useState } from "react";

import { LoginForm } from "@/components/login-form";
import { RecipeImportFlow } from "@/components/recipe-import-flow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../convex/_generated/api";

type AppView = "home" | "import";

export function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const viewer = useQuery(api.users.viewer);
  const recipes = useQuery(api.recipes.list);
  const [view, setView] = useState<AppView>("home");

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

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Recettes</h1>
          {viewer?.name || viewer?.email ? (
            <p className="text-sm text-muted-foreground">
              {viewer.name ?? viewer.email}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {view === "import" ? (
            <Button variant="outline" onClick={() => setView("home")}>
              Accueil
            </Button>
          ) : (
            <Button onClick={() => setView("import")}>
              Importer une recette
            </Button>
          )}
          <Button variant="outline" onClick={() => void signOut()}>
            Se déconnecter
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6">
        {view === "import" ? (
          <RecipeImportFlow
            onCancel={() => setView("home")}
            onSaved={() => setView("home")}
          />
        ) : (
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
                      <li
                        key={recipe._id}
                        className="rounded-lg border px-4 py-3"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">{recipe.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {[
                              recipe.servings
                                ? `${recipe.servings} portion${recipe.servings > 1 ? "s" : ""}`
                                : null,
                              recipe.prepTime
                                ? `${recipe.prepTime} min prep`
                                : null,
                              recipe.cookTime
                                ? `${recipe.cookTime} min cuisson`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Détails à compléter"}
                          </p>
                          {recipe.sourceUrl ? (
                            <a
                              href={recipe.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary underline-offset-4 hover:underline"
                            >
                              Source
                            </a>
                          ) : null}
                          {recipe.tags.length > 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {recipe.tags.join(", ")}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
