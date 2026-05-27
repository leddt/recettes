import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useAction, useQuery } from "convex/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
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

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

type RecipeListEntry = {
  _id: Id<"recipes">;
  name: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  sourceUrl?: string;
  tags: string[];
  source?: "text" | "semantic";
};

function RecipeListItems({ recipes }: { recipes: RecipeListEntry[] }) {
  if (recipes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune recette ne correspond à votre recherche.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {recipes.map((recipe) => (
        <li key={recipe._id}>
          <Link
            to={`/recipes/${recipe._id}`}
            className="flex w-full flex-col gap-1 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{recipe.name}</p>
              {recipe.source === "semantic" ? (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  Suggestion
                </span>
              ) : null}
            </div>
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
  );
}

type SearchState = {
  forQuery: string;
  results: RecipeListEntry[] | null;
  error: string | null;
};

function RecipeListPage() {
  const recipes = useQuery(api.recipes.list);
  const searchRecipes = useAction(api.recipeSearch.search);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const isSearchActive = debouncedQuery.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (!isSearchActive) {
      return;
    }

    const queryAtStart = debouncedQuery;
    let cancelled = false;

    void searchRecipes({ query: debouncedQuery })
      .then((results) => {
        if (!cancelled) {
          setSearchState({
            forQuery: queryAtStart,
            results,
            error: null,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSearchState({
            forQuery: queryAtStart,
            results: [],
            error:
              error instanceof Error
                ? error.message
                : "La recherche a échoué.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isSearchActive, searchRecipes]);

  const searchMatchesQuery =
    searchState !== null && searchState.forQuery === debouncedQuery;
  const displayedRecipes = isSearchActive
    ? searchMatchesQuery
      ? searchState.results
      : null
    : recipes;
  const searchError = searchMatchesQuery ? searchState.error : null;
  const isLoading = isSearchActive
    ? !searchMatchesQuery || searchState.results === null
    : recipes === undefined;

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
        <CardContent className="flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher par nom, ingrédient, tag…"
              className="pl-9"
              aria-label="Rechercher des recettes"
            />
          </div>

          {searchError ? (
            <p className="text-sm text-destructive">{searchError}</p>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              {isSearchActive ? "Recherche en cours…" : "Chargement des recettes…"}
            </p>
          ) : !isSearchActive && displayedRecipes?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune recette enregistrée pour le moment.
            </p>
          ) : displayedRecipes ? (
            <RecipeListItems recipes={displayedRecipes} />
          ) : null}
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
