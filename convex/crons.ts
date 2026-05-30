import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";
import { ORPHAN_CLEANUP_BATCH_SIZE } from "./files";

const crons = cronJobs();

crons.cron(
  "cleanup orphaned storage files",
  "0 4 * * 0",
  internal.files.cleanupOrphanedStorage,
  {
    paginationOpts: {
      numItems: ORPHAN_CLEANUP_BATCH_SIZE,
      cursor: null,
    },
  },
);

export default crons;
