import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_ACCOUNT } from "@/lib/defaults";
import {
  getLoginErrorMessage,
  INVALID_LOGIN_MESSAGE,
} from "@/lib/auth-errors";

const isDev = import.meta.env.DEV;

export function LoginForm() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState<string>(
    isDev ? DEFAULT_ACCOUNT.email : "",
  );
  const [password, setPassword] = useState<string>(
    isDev ? DEFAULT_ACCOUNT.password : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("password", {
        flow: "signIn",
        email,
        password,
      });

      if (!result.signingIn) {
        setError(INVALID_LOGIN_MESSAGE);
      }
    } catch (submitError) {
      setError(getLoginErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connectez-vous pour accéder à Recettes.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={error !== null}>
              <FieldLabel htmlFor="email">Courriel</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setError(null);
                  setEmail(event.target.value);
                }}
                aria-invalid={error !== null}
                required
              />
            </Field>
            <Field data-invalid={error !== null}>
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setError(null);
                  setPassword(event.target.value);
                }}
                aria-invalid={error !== null}
                required
              />
              {error !== null ? <FieldError>{error}</FieldError> : null}
            </Field>
            {isDev ? (
              <FieldDescription>
                Compte de démonstration : {DEFAULT_ACCOUNT.email} /{" "}
                {DEFAULT_ACCOUNT.password}
              </FieldDescription>
            ) : null}
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
