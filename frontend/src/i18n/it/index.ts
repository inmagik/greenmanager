import auth from "./auth"
import common from "./common"
import tenants from "./tenants"
import users from "./users"

export default { ...common, ...auth, ...users, ...tenants } as const
