import React from 'react';
import Header from '../components/Header';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

// This layout wraps every page with the Header (which includes NavbarBreadcrumbs)
export default function Layout({ children, currentPage }: LayoutProps) {
  return (
    <>
      <Header currentPage={currentPage} />
      <main style={{ flex: 1, width: '100%' }}>{children}</main>
    </>
  );
}
