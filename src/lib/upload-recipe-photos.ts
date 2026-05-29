import type { Id } from "../../convex/_generated/dataModel";

import { MAX_RECIPE_PHOTOS } from "../../convex/lib/recipeImageLimits";
import { isRecipePhotoFile } from "./is-recipe-photo-file";

type GenerateUploadUrl = () => Promise<string>;

export async function uploadRecipePhotos(
  files: File[],
  generateUploadUrl: GenerateUploadUrl,
): Promise<Id<"_storage">[]> {
  if (files.length === 0) {
    throw new Error("Ajoutez au moins une photo.");
  }

  if (files.length > MAX_RECIPE_PHOTOS) {
    throw new Error(`Maximum ${MAX_RECIPE_PHOTOS} photos par import.`);
  }

  const storageIds: Id<"_storage">[] = [];

  for (const file of files) {
    if (!isRecipePhotoFile(file)) {
      throw new Error("Seules les images sont acceptées.");
    }

    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Impossible de téléverser une photo.");
    }

    const { storageId } = (await response.json()) as {
      storageId: Id<"_storage">;
    };
    storageIds.push(storageId);
  }

  return storageIds;
}
