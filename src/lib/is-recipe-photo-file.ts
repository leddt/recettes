/** Accepts images from file pickers and mobile camera (sometimes missing MIME). */
export function isRecipePhotoFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  // iOS Safari camera captures often omit the MIME type.
  if (file.type === "" && file.size > 0) {
    return true;
  }

  return false;
}
