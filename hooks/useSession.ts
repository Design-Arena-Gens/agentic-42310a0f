'use client';

import { useContext } from "react";
import { SessionContext } from "@/components/providers";

export function useSession() {
  return useContext(SessionContext);
}
