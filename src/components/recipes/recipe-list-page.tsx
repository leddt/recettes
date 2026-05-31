import { useAction, useQuery } from "convex/react";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { RecipeActivityFeed } from "@/components/recipes/recipe-activity-feed";
import { RecipeErrorAlert } from "@/components/recipes/recipe-error-alert";
import {
  RecipeListItem,
  type RecipeListEntry,
} from "@/components/recipes/recipe-list-item";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ItemGroup } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../convex/_generated/api";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

type SearchState = {
  forQuery: string;
  results: RecipeListEntry[] | null;
  error: string | null;
};

function RecipeListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

function RecipeListEmpty({ isSearchActive }: { isSearchActive: boolean }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>
          {isSearchActive
            ? "Aucun résultat"
            : "Aucune recette enregistrée"}
        </EmptyTitle>
        <EmptyDescription>
          {isSearchActive
            ? "Aucune recette ne correspond à votre recherche."
            : "Importez une recette depuis une URL ou des photos pour commencer."}
        </EmptyDescription>
      </EmptyHeader>
      {!isSearchActive ? (
        <EmptyContent>
          <Button nativeButton={false} render={<Link to="/import" />}>
            Importer une recette
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export function RecipeListPage() {
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

  const hasRecipes =
    !isLoading &&
    displayedRecipes !== null &&
    displayedRecipes !== undefined &&
    displayedRecipes.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <RecipeActivityFeed />
      <Card>
        <CardHeader>
          <CardTitle>Vos recettes</CardTitle>
          <CardDescription>
            Importez une recette depuis une URL, vérifiez les détails extraits,
            puis enregistrez-la ici.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Rechercher par nom, ingrédient, tag…"
              aria-label="Rechercher des recettes"
            />
          </InputGroup>

          {searchError ? <RecipeErrorAlert message={searchError} /> : null}

          {isLoading ? (
            <RecipeListSkeleton />
          ) : hasRecipes ? (
            <ItemGroup>
              {(displayedRecipes as RecipeListEntry[]).map((recipe) => (
                <RecipeListItem key={recipe._id} recipe={recipe} />
              ))}
            </ItemGroup>
          ) : (
            <RecipeListEmpty isSearchActive={isSearchActive} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
