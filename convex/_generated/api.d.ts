/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_defaults from "../lib/defaults.js";
import type * as lib_htmlParse from "../lib/htmlParse.js";
import type * as lib_recipeAi from "../lib/recipeAi.js";
import type * as lib_recipeChatAi from "../lib/recipeChatAi.js";
import type * as lib_recipeChatContext from "../lib/recipeChatContext.js";
import type * as lib_recipeChatTitle from "../lib/recipeChatTitle.js";
import type * as lib_recipeEmbeddings from "../lib/recipeEmbeddings.js";
import type * as lib_recipeImageLimits from "../lib/recipeImageLimits.js";
import type * as lib_recipeJsonLd from "../lib/recipeJsonLd.js";
import type * as lib_recipeSearchText from "../lib/recipeSearchText.js";
import type * as lib_recipeValidators from "../lib/recipeValidators.js";
import type * as lib_urlFetch from "../lib/urlFetch.js";
import type * as recipeChat from "../recipeChat.js";
import type * as recipeChatActions from "../recipeChatActions.js";
import type * as recipeImport from "../recipeImport.js";
import type * as recipeSearch from "../recipeSearch.js";
import type * as recipes from "../recipes.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  files: typeof files;
  http: typeof http;
  "lib/defaults": typeof lib_defaults;
  "lib/htmlParse": typeof lib_htmlParse;
  "lib/recipeAi": typeof lib_recipeAi;
  "lib/recipeChatAi": typeof lib_recipeChatAi;
  "lib/recipeChatContext": typeof lib_recipeChatContext;
  "lib/recipeChatTitle": typeof lib_recipeChatTitle;
  "lib/recipeEmbeddings": typeof lib_recipeEmbeddings;
  "lib/recipeImageLimits": typeof lib_recipeImageLimits;
  "lib/recipeJsonLd": typeof lib_recipeJsonLd;
  "lib/recipeSearchText": typeof lib_recipeSearchText;
  "lib/recipeValidators": typeof lib_recipeValidators;
  "lib/urlFetch": typeof lib_urlFetch;
  recipeChat: typeof recipeChat;
  recipeChatActions: typeof recipeChatActions;
  recipeImport: typeof recipeImport;
  recipeSearch: typeof recipeSearch;
  recipes: typeof recipes;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
