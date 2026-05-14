import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import UserHeader from './UserHeader';

interface AppShellProps {
  children: ReactNode;
}

const publicPaths = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-otp'
]);

const sharedPublicHeaderPaths = new Set(['/', '/creator-package']);
const shellHiddenPrefixes = ['/dashboard-admin'];

export default function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation();

  if (shellHiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return <>{children}</>;
  }

  if (sharedPublicHeaderPaths.has(pathname)) {
    return (
      <>
        <PublicHeader />
        {children}
      </>
    );
  }

  const isPublicPage = publicPaths.has(pathname);

  if (isPublicPage) {
    return <>{children}</>;
  }

  const hideCoinPaths = new Set(['/dashboard', '/update-profile']);
  const showCoin = !hideCoinPaths.has(pathname);

  return (
    <>
      <UserHeader showCoin={showCoin} />
      {children}
    </>
  );
}