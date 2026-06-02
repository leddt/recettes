import { BellIcon, BellOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

function formatActivationSummary(
  count: number,
  includesThisDevice: boolean,
): string {
  if (includesThisDevice) {
    if (count === 1) {
      return "Activé sur cet appareil";
    }
    return `Activé sur ${count} appareils, incluant celui-ci`;
  }

  const deviceLabel =
    count === 1 ? "1 autre appareil" : `${count} autres appareils`;
  return `Activé sur ${deviceLabel}`;
}

export function NotificationSettings() {
  const {
    supported,
    permissionDenied,
    isLoading,
    error,
    accountCount,
    enabledOnThisDevice,
    enabledElsewhere,
    enableOnThisDevice,
    disableOnThisDevice,
    disableEverywhere,
  } = usePushNotifications();

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Notifications non disponibles sur cet appareil
      </p>
    );
  }

  if (permissionDenied) {
    return (
      <p className="text-sm text-muted-foreground">
        Autorisez les notifications dans les paramètres du navigateur.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {accountCount > 0 ? (
        <p className="text-sm font-medium">
          {formatActivationSummary(accountCount, enabledOnThisDevice)}
        </p>
      ) : null}

      {enabledOnThisDevice ? (
        <>
          <p className="text-sm text-muted-foreground">
            Cet appareil reçoit les notifications lorsqu&apos;un autre membre
            ajoute une recette.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => void disableOnThisDevice()}
            >
              <BellOffIcon />
              {isLoading ? "Chargement..." : "Désactiver sur cet appareil"}
            </Button>
            {accountCount > 0 ? (
              <Button
                variant="destructive"
                disabled={isLoading}
                onClick={() => void disableEverywhere()}
              >
                Désactiver partout
              </Button>
            ) : null}
          </div>
        </>
      ) : enabledElsewhere ? (
        <>
          <p className="text-sm text-muted-foreground">
            Les notifications ne sont pas activées sur cet appareil.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isLoading} onClick={() => void enableOnThisDevice()}>
              <BellIcon />
              {isLoading ? "Chargement..." : "Activer sur cet appareil"}
            </Button>
            <Button
              variant="destructive"
              disabled={isLoading}
              onClick={() => void disableEverywhere()}
            >
              Désactiver partout
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Recevez une notification lorsqu&apos;un autre membre ajoute une recette.
          </p>
          <Button disabled={isLoading} onClick={() => void enableOnThisDevice()}>
            <BellIcon />
            {isLoading ? "Chargement..." : "Activer les notifications"}
          </Button>
        </>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
