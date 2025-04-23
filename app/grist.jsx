"use client";

import React, {
  useState,
  createContext,
  useContext,
} from "react";
import Script from "next/script";

const GristContext = createContext(null);

export const useGrist = () => useContext(GristContext);

export default function GristProvider({
  children,
  apiFeatures,
}) {
  const [gristOb, setGristOb] = useState(null);

  const handleScriptLoad = () => {
    if (window.grist) {
      const extendedGrist = { ...window.grist, ...apiFeatures };
      setGristOb(extendedGrist);
    }
  };

  return (
    <GristContext.Provider value={gristOb}>
      <Script src="/grist-plugin-api.js" onLoad={handleScriptLoad} />
      <div>{children}</div>
    </GristContext.Provider>
  );
}
