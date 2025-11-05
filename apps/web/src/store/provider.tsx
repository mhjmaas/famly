"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { type AppStore, makeStore, type RootState } from "./store";

interface StoreProviderProps {
  children: React.ReactNode;
  preloadedState?: Partial<RootState>;
}

export function StoreProvider({
  children,
  preloadedState,
}: StoreProviderProps) {
  const storeRef = useRef<AppStore | undefined>(undefined);

  if (!storeRef.current) {
    storeRef.current = makeStore(preloadedState);
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
