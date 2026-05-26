import { createAccount, retrieveAccount } from "@convex-dev/auth/server";

import { DEFAULT_ACCOUNT } from "./lib/defaults";
import { internalAction } from "./_generated/server";

export const seedDefaultAccount = internalAction({
  args: {},
  handler: async (ctx) => {
    const { email, password, name } = DEFAULT_ACCOUNT;

    try {
      const existing = await retrieveAccount(ctx, {
        provider: "password",
        account: { id: email, secret: password },
      });

      return { email, userId: existing.user._id };
    } catch {
      const created = await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: password },
        profile: { email, name },
        shouldLinkViaEmail: false,
        shouldLinkViaPhone: false,
      });

      return { email, userId: created.user._id };
    }
  },
});
