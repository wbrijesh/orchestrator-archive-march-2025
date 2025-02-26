'use client';

import { UserProvider } from '@/context/UserContext';

export default function AppLayout({ children }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
