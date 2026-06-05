import { BellIcon, SunMoonIcon, UsersIcon } from "lucide-react";

import { NotificationSettings } from "@/components/layout/notification-settings";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { UserSettings } from "@/components/settings/user-settings";
import { isVapidConfigured } from "@/lib/push-notifications";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsPage() {
  const showNotifications = isVapidConfigured();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 sm:px-0">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-normal">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Préférences de votre compte et de l&apos;application.
        </p>
      </div>

      {showNotifications ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="size-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Recevez une notification push lorsqu&apos;un autre membre ajoute une
              recette.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettings />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SunMoonIcon className="size-5" />
            Apparence
          </CardTitle>
          <CardDescription>
            Choisissez le thème d&apos;affichage de l&apos;application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-5" />
            Utilisateurs
          </CardTitle>
          <CardDescription>
            Gérez les comptes utilisateurs : création, modification, mot de passe
            et suppression.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserSettings />
        </CardContent>
      </Card>
    </div>
  );
}
