import { createAccount } from "@convex-dev/auth/server";

import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export type CreatePasswordAccountInput = {
  email: string;
  password: string;
  name: string;
};

export type CreatePasswordAccountResult = {
  email: string;
  userId: Id<"users">;
};

export async function createPasswordAccount(
  ctx: ActionCtx,
  input: CreatePasswordAccountInput,
): Promise<CreatePasswordAccountResult> {
  const email = input.email.trim();
  const name = input.name.trim();
  const password = input.password;

  if (!email || !name || !password) {
    throw new Error("email, password et name sont requis.");
  }

  const created = await createAccount(ctx, {
    provider: "password",
    account: { id: email, secret: password },
    profile: { email, name },
    shouldLinkViaEmail: false,
    shouldLinkViaPhone: false,
  });

  return { email, userId: created.user._id };
}
