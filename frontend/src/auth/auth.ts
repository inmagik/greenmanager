import { MakeAuthTools } from "@inmagik/react-auth"
import { useAction } from "@inmagik/react-crud"
import { API_URL } from "../constants"
import type { Credentials, Tokens, User } from "./types"

export async function refresh(tokens: Tokens) {
  const { refresh } = tokens
  const res = await fetch(`${API_URL}/api/core/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refresh }),
  })
  if (res.ok) {
    const refreshedTokens = await res.json()
    return { ...tokens, ...refreshedTokens }
  }
  return null
}

export async function getUserData(tokens: Tokens) {
  const { access } = tokens
  const userRes = await fetch(`${API_URL}/api/core/auth/me/`, {
    headers: {
      Authorization: `Bearer ${access}`,
    },
  })
  if (userRes.ok) {
    const user = await userRes.json()
    return user as User
  }
  return null
}

export async function login(credentials: Credentials) {
  const res = await fetch(`${API_URL}/api/core/auth/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })
  if (res.ok) {
    const tokens = await res.json()
    return tokens as Tokens
  }

  // The message is a code, translated by the login page (auth.loginErrors).
  if (res.status === 401 || res.status === 400) {
    throw new Error("invalid_credentials")
  }

  // django-axes answers 429 (or 403 through DRF) after too many failed attempts.
  if (res.status === 429 || res.status === 403) {
    throw new Error("account_locked")
  }

  throw new Error("login_unavailable")
}

function base64UrlDecode(input: string): string {
  // atob works just fine, but there might be some issues in some browsers since JWTs
  // use base64url encoding, so we need to replace the characters and add padding if necessary
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const padding = base64.length % 4
  if (padding === 2) {
    base64 += "=="
  } else if (padding === 3) {
    base64 += "="
  } else if (padding === 1) {
    throw new Error("Invalid base64url string")
  }
  return atob(base64)
}

function getExpireDate(token: string) {
  const payload = token.split(".")[1]
  const decoded = base64UrlDecode(payload)
  const data = JSON.parse(decoded)
  const exp = data.exp * 1000
  return new Date(exp)
}

export function getTokenExpireDate(tokens: { access: string }) {
  return getExpireDate(tokens.access)
}

export function getRefreshExpireDate(tokens: { refresh: string }) {
  return getExpireDate(tokens.refresh)
}

export function useUpdateMe() {
  // useAction appends "/" to the path: no trailing slash here.
  return useAction<User, Partial<Pick<User, "full_name">>>(`${API_URL}/api/core/auth/me`, { method: "PATCH" })
}

export const [AuthProvider, useAuth] = MakeAuthTools<User, Tokens, Credentials>()
