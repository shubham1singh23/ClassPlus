import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getBackendMe } from "./api";

const BackendAuthContext = createContext(null);

function normalizeError(error) {
  return {
    message:
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Unknown backend auth error",
    status: error?.response?.status || null,
  };
}

export function BackendAuthProvider({ children }) {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const [state, setState] = useState({
    loading: true,
    backendUser: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        if (active) setState({ loading: false, backendUser: null, error: null });
        return;
      }

      if (active) setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const token = await getToken();
        if (!token) throw new Error("Missing Clerk token");
        if (import.meta.env.DEV) {
          console.log({
            clerkLoaded: isLoaded,
            signedIn: isSignedIn,
            tokenPreview: `${token.slice(0, 12)}...`,
            tokenLength: token.length,
            backend: import.meta.env.VITE_BACKEND_URL,
          });
        }
        const backendUser = await getBackendMe();
        if (active) setState({ loading: false, backendUser, error: null });
      } catch (error) {
        if (active) setState({ loading: false, backendUser: null, error: normalizeError(error) });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  const value = useMemo(
    () => ({
      ...state,
      refresh: async () => {
        setState((current) => ({ ...current, loading: true }));
        try {
          const backendUser = await getBackendMe();
          setState({ loading: false, backendUser, error: null });
          return backendUser;
        } catch (error) {
          setState({ loading: false, backendUser: null, error: normalizeError(error) });
          throw error;
        }
      },
    }),
    [state]
  );

  return <BackendAuthContext.Provider value={value}>{children}</BackendAuthContext.Provider>;
}

export function useBackendAuth() {
  const context = useContext(BackendAuthContext);
  if (!context) {
    throw new Error("useBackendAuth must be used within BackendAuthProvider");
  }
  return context;
}
