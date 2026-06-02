import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";

import {
  getLocalPushEndpoint,
  isNotificationPermissionDenied,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-notifications";
import { api } from "../../convex/_generated/api";

export function usePushNotifications() {
  const accountStatus = useQuery(api.pushSubscriptions.accountStatus);
  const saveSubscription = useMutation(api.pushSubscriptions.save);
  const removeSubscription = useMutation(api.pushSubscriptions.remove);
  const removeAllSubscriptions = useMutation(api.pushSubscriptions.removeAll);
  const [localEndpoint, setLocalEndpoint] = useState<string | null | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported = isPushSupported();
  const permissionDenied = isNotificationPermissionDenied();
  const accountCount = accountStatus?.count ?? 0;
  const accountEndpoints = accountStatus?.endpoints ?? [];

  const refreshLocalEndpoint = useCallback(async () => {
    if (!supported) {
      setLocalEndpoint(null);
      return;
    }

    setLocalEndpoint(await getLocalPushEndpoint());
  }, [supported]);

  useEffect(() => {
    void refreshLocalEndpoint();
  }, [refreshLocalEndpoint]);

  useEffect(() => {
    if (
      !supported ||
      accountStatus === undefined ||
      localEndpoint === undefined ||
      localEndpoint === null ||
      accountStatus.count > 0
    ) {
      return;
    }

    let cancelled = false;
    void unsubscribeFromPush().then(() => {
      if (!cancelled) {
        setLocalEndpoint(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [accountStatus, localEndpoint, supported]);

  const enabledOnThisDevice =
    localEndpoint !== undefined &&
    localEndpoint !== null &&
    accountEndpoints.includes(localEndpoint);
  const enabledElsewhere = !enabledOnThisDevice && accountCount > 0;
  const isCheckingLocal = supported && localEndpoint === undefined;

  const enableOnThisDevice = useCallback(async () => {
    if (!supported) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscription = await subscribeToPush();
      await saveSubscription(subscription);
      setLocalEndpoint(subscription.endpoint);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [saveSubscription, supported]);

  const disableOnThisDevice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint !== null) {
        await removeSubscription({ endpoint });
      }
      setLocalEndpoint(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [removeSubscription]);

  const disableEverywhere = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await removeAllSubscriptions({});
      if (supported) {
        await unsubscribeFromPush();
      }
      setLocalEndpoint(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [removeAllSubscriptions, supported]);

  return {
    supported,
    permissionDenied,
    isLoading: isLoading || isCheckingLocal,
    error,
    accountCount,
    enabledOnThisDevice,
    enabledElsewhere,
    enableOnThisDevice,
    disableOnThisDevice,
    disableEverywhere,
  };
}
