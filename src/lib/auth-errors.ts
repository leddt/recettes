import { extractErrorMessage } from "@/lib/errors";

const INVALID_CREDENTIALS_PATTERNS = [
  "Invalid credentials",
  "InvalidAccountId",
  "InvalidSecret",
] as const;

export const INVALID_LOGIN_MESSAGE =
  "Courriel ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.";

export function getLoginErrorMessage(error: unknown): string {
  const message = extractErrorMessage(error);

  if (message === null) {
    return "Connexion impossible pour le moment. Réessayez plus tard.";
  }

  if (
    INVALID_CREDENTIALS_PATTERNS.some((pattern) => message.includes(pattern))
  ) {
    return INVALID_LOGIN_MESSAGE;
  }

  if (message.includes("TooManyFailedAttempts")) {
    return "Trop de tentatives de connexion. Veuillez patienter quelques minutes avant de réessayer.";
  }

  if (/network|fetch failed|failed to fetch/i.test(message)) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.";
  }

  return "Connexion impossible pour le moment. Réessayez plus tard.";
}
