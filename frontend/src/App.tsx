import { AuthProvider, getRefreshExpireDate, getTokenExpireDate, getUserData, login, refresh } from "./auth/auth"
import { TenantProvider } from "./context/TenantProvider"
import DataProvider from "./general/DataProvider"
import { ThemeProvider } from "./general/ThemeProvider"
import { Navigation } from "./Navigation"

function App() {
  return (
    <AuthProvider
      login={login}
      refresh={refresh}
      getUserData={getUserData}
      getTokenExpireDate={getTokenExpireDate}
      getRefreshExpireDate={getRefreshExpireDate}
    >
      <TenantProvider>
        <DataProvider>
          <ThemeProvider>
            <Navigation />
          </ThemeProvider>
        </DataProvider>
      </TenantProvider>
    </AuthProvider>
  )
}

export default App
