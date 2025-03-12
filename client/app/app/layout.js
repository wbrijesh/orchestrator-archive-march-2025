"use client";

import { UserProvider } from "@/context/UserContext";
import { useEffect, useState } from "react";

export default function AppLayout({ children }) {
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    setIsLocalhost(window.location.hostname === "localhost");
  }, []);

  return (
    <UserProvider>
      {isLocalhost && <div className="overlay"></div>}
      {children}
    </UserProvider>
  );
}
