"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
export function AuthBootstrap() {
  const initialized = useAuthStore((state) => state.initialized);
  const restore = useAuthStore((state) => state.restore);
  useEffect(() => {
    if (!initialized) void restore();
  }, [initialized, restore]);
  return null;
}
