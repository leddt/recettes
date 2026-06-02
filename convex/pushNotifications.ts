"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (publicKey === undefined || privateKey === undefined || subject === undefined) {
    return null;
  }
  return { publicKey, privateKey, subject };
}

export const sendNewRecipePush = internalAction({
  args: { recipeId: v.id("recipes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const vapid = getVapidConfig();
    if (vapid === null) {
      console.warn("VAPID keys not configured, skipping push notifications");
      return null;
    }

    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    const targets = await ctx.runQuery(
      internal.pushSubscriptions.listTargetsForRecipe,
      { recipeId: args.recipeId },
    );

    if (targets.subscriptions.length === 0) {
      return null;
    }

    const defaultIcon = "/pwa-192x192.png";
    const payload = JSON.stringify({
      title: "Nouvelle recette",
      body: `${targets.authorName} a ajouté « ${targets.recipeName} »`,
      icon: targets.coverImageUrl ?? defaultIcon,
      badge: defaultIcon,
      ...(targets.coverImageUrl !== undefined
        ? { image: targets.coverImageUrl }
        : {}),
      data: {
        url: `/recipes/${args.recipeId}`,
      },
    });

    for (const subscription of targets.subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
      } catch (error) {
        const statusCode =
          error !== null &&
          typeof error === "object" &&
          "statusCode" in error &&
          typeof error.statusCode === "number"
            ? error.statusCode
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          await ctx.runMutation(internal.pushSubscriptions.deleteById, {
            subscriptionId: subscription._id,
          });
        } else {
          console.error("Failed to send push notification:", error);
        }
      }
    }

    return null;
  },
});
