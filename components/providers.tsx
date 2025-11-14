'use client';

import { createContext, useEffect, useMemo, useState } from "react";
import { SWRConfig } from "swr";
import axios from "axios";

type SessionContextValue = {
  userId: string | null;
  setUserId: (value: string | null) => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  adminToken: string | null;
  setAdminToken: (value: string | null) => void;
};

export const SessionContext = createContext<SessionContextValue>({
  userId: null,
  setUserId: () => {},
  isAdmin: false,
  setIsAdmin: () => {},
  adminToken: null,
  setAdminToken: () => {}
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminTokenState] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("aurora_user_id") : null;
    if (storedUser) {
      setUserIdState(storedUser);
    }
    const storedAdmin = typeof window !== "undefined" ? localStorage.getItem("aurora_is_admin") : null;
    if (storedAdmin === "true") {
      setIsAdmin(true);
    }
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("aurora_admin_token") : null;
    if (storedToken) {
      setAdminTokenState(storedToken);
    }
  }, []);

  const setUserId = (value: string | null) => {
    if (typeof window !== "undefined") {
      if (value) {
        localStorage.setItem("aurora_user_id", value);
      } else {
        localStorage.removeItem("aurora_user_id");
      }
    }
    setUserIdState(value);
  };

  const handleSetAdmin = (value: boolean) => {
    if (typeof window !== "undefined") {
      if (value) {
        localStorage.setItem("aurora_is_admin", "true");
      } else {
        localStorage.removeItem("aurora_is_admin");
      }
    }
    setIsAdmin(value);
  };

  const setAdminToken = (value: string | null) => {
    if (typeof window !== "undefined") {
      if (value) {
        localStorage.setItem("aurora_admin_token", value);
      } else {
        localStorage.removeItem("aurora_admin_token");
      }
    }
    setAdminTokenState(value);
  };

  const swrValue = useMemo(
    () => ({
      fetcher: async (url: string) => {
        const response = await axios.get(url, {
          headers: {
            ...(userId ? { "x-user-id": userId } : {}),
            ...(adminToken ? { "x-admin-token": adminToken } : {})
          }
        });
        return response.data;
      },
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }),
    [userId, adminToken]
  );

  const value = useMemo(
    () => ({
      userId,
      setUserId,
      isAdmin,
      setIsAdmin: handleSetAdmin,
      adminToken,
      setAdminToken
    }),
    [userId, isAdmin, adminToken]
  );

  return (
    <SessionContext.Provider value={value}>
      <SWRConfig value={swrValue}>{children}</SWRConfig>
    </SessionContext.Provider>
  );
}
