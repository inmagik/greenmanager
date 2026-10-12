import auth from "./auth"
import catalogs from "./catalogs"
import common from "./common"
import parties from "./parties"
import tenants from "./tenants"
import users from "./users"

// The modules add the codes of their errors to `serverErrors`, which the spread would overwrite.
export default {
  ...common,
  ...auth,
  ...users,
  ...tenants,
  ...parties,
  ...catalogs,
  serverErrors: { ...common.serverErrors, ...parties.serverErrors, ...catalogs.serverErrors },
} as const
