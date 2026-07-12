const DEFAULT_ERROR_MESSAGE = "Une erreur inattendue s'est produite.";

export function extractErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return null;
}

export function getErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR_MESSAGE,
): string {
  return extractErrorMessage(error) ?? fallback;
}
