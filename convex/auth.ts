import { ConvexError } from "convex/values";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        if (params.flow === "signUp") {
          throw new ConvexError("L'inscription est désactivée.");
        }
        return { email: params.email as string };
      },
    }),
  ],
});