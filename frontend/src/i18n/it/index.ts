import auth from "./auth"
import catalogs from "./catalogs"
import common from "./common"
import inventory from "./inventory"
import map from "./map"
import parties from "./parties"
import tenants from "./tenants"
import territory from "./territory"
import users from "./users"

// The modules add the codes of their errors to `serverErrors`, which the spread would overwrite.
export default {
  ...common,
  ...auth,
  ...users,
  ...tenants,
  ...parties,
  ...catalogs,
  ...territory,
  ...inventory,
  ...map,
  serverErrors: {
    ...common.serverErrors,
    ...parties.serverErrors,
    ...catalogs.serverErrors,
    ...territory.serverErrors,
    ...inventory.serverErrors,
  },
} as const
