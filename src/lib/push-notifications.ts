export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isVapidConfigured(): boolean {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  return typeof vapidPublicKey === "string" && vapidPublicKey.length > 0;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}

export type PushSubscriptionPayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function subscribeToPush(): Promise<PushSubscriptionPayload> {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (typeof vapidPublicKey !== "string" || vapidPublicKey.length === 0) {
    throw new Error("Les notifications push ne sont pas configurées.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      "Autorisez les notifications dans les paramètres du navigateur.",
    );
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const json = subscription.toJSON();
  if (
    json.endpoint === undefined ||
    json.keys?.p256dh === undefined ||
    json.keys?.auth === undefined
  ) {
    throw new Error("Abonnement push invalide.");
  }

  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  };
}

export async function getLocalPushEndpoint(): Promise<string | null> {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription?.endpoint ?? null;
}

export async function unsubscribeFromPush(): Promise<string | null> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription === null) {
    return null;
  }

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}

export function isNotificationPermissionDenied(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "denied"
  );
}
