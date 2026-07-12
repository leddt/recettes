import { retrieveAccount } from "@convex-dev/auth/server";

import { DEFAULT_ACCOUNT } from "@shared/defaults";
import { createPasswordAccount } from "./lib/createPasswordAccount";
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
      return await createPasswordAccount(ctx, { email, password, name });
    }
  },
});
