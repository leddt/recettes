import { useAction, useQuery } from "convex/react";
import { ChevronDown, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { RecipeActivityFeed } from "@/components/recipes/recipe-activity-feed";
import { RecipeErrorAlert } from "@/components/recipes/recipe-error-alert";
import {
  RecipeListItem,
  type RecipeListEntry,
} from "@/components/recipes/recipe-list-item";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { Id } from "../../../convex/_generated/dataModel";

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

function RecipeListEmpty({
  isSearchActive,
  isCollectionFilterActive,
}: {
  isSearchActive: boolean;
  isCollectionFilterActive: boolean;
}) {
  const title = isCollectionFilterActive
    ? "Aucune recette dans cette collection"
    : isSearchActive
      ? "Aucun résultat"
      : "Aucune recette enregistrée";
  const description = isCollectionFilterActive
    ? "Ajoutez des recettes à cette collection depuis le menu d'actions de chaque recette."
    : isSearchActive
      ? "Aucune recette ne correspond à votre recherche."
      : "Importez une recette depuis une URL ou des photos pour commencer.";

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {!isSearchActive && !isCollectionFilterActive ? (
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
  const collections = useQuery(api.collections.list);
  const searchRecipes = useAction(api.recipeSearch.search);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] =
    useState<Id<"collections"> | null>(null);
  const [collectionFilterOpen, setCollectionFilterOpen] = useState(false);
  const validSelectedCollectionId = useMemo(() => {
    if (selectedCollectionId === null || collections === undefined) {
      return null;
    }
    return collections.some(
      (collection) => collection._id === selectedCollectionId,
    )
      ? selectedCollectionId
      : null;
  }, [collections, selectedCollectionId]);
  const recipeIdsInCollection = useQuery(
    api.collections.listRecipeIdsByCollection,
    validSelectedCollectionId
      ? { collectionId: validSelectedCollectionId }
      : "skip",
  );

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
  const baseRecipes = isSearchActive
    ? searchMatchesQuery
      ? searchState.results
      : null
    : recipes;
  const searchError = searchMatchesQuery ? searchState.error : null;
  const isBaseLoading = isSearchActive
    ? !searchMatchesQuery || searchState.results === null
    : recipes === undefined;
  const isCollectionFilterActive = validSelectedCollectionId !== null;
  const membershipSet = useMemo(
    () => new Set(recipeIdsInCollection ?? []),
    [recipeIdsInCollection],
  );
  const displayedRecipes = useMemo(() => {
    if (baseRecipes === null || baseRecipes === undefined) {
      return baseRecipes;
    }
    if (!isCollectionFilterActive) {
      return baseRecipes;
    }
    if (recipeIdsInCollection === undefined) {
      return null;
    }
    return baseRecipes.filter((recipe) => membershipSet.has(recipe._id));
  }, [
    baseRecipes,
    isCollectionFilterActive,
    membershipSet,
    recipeIdsInCollection,
  ]);
  const isLoading =
    isBaseLoading ||
    (isCollectionFilterActive && recipeIdsInCollection === undefined);

  const hasRecipes =
    !isLoading &&
    displayedRecipes !== null &&
    displayedRecipes !== undefined &&
    displayedRecipes.length > 0;

  const selectedCollection = collections?.find(
    (collection) => collection._id === validSelectedCollectionId,
  );
  const collectionFilterLabel = selectedCollection?.name ?? "Toutes les collections";

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
          <div className="flex flex-col gap-3 sm:flex-row">
            <InputGroup className="flex-1">
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
            {collections !== undefined && collections.length > 0 ? (
              <DropdownMenu
                open={collectionFilterOpen}
                onOpenChange={setCollectionFilterOpen}
              >
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between sm:w-auto sm:min-w-48"
                      aria-label="Filtrer par collection"
                    />
                  }
                >
                  <span className="truncate">{collectionFilterLabel}</span>
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuRadioGroup
                    value={validSelectedCollectionId ?? "all"}
                    onValueChange={(value) => {
                      setSelectedCollectionId(
                        value === "all" ? null : (value as Id<"collections">),
                      );
                      setCollectionFilterOpen(false);
                    }}
                  >
                    <DropdownMenuRadioItem value="all">
                      Toutes les collections
                    </DropdownMenuRadioItem>
                    {collections.map((collection) => (
                      <DropdownMenuRadioItem
                        key={collection._id}
                        value={collection._id}
                      >
                        {collection.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

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
            <RecipeListEmpty
              isSearchActive={isSearchActive}
              isCollectionFilterActive={isCollectionFilterActive}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
