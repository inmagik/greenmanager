import auth from "./auth"
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
  serverErrors: { ...common.serverErrors, ...parties.serverErrors },
} as const
