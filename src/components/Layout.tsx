import React from 'react';
import Header from '../components/Header';
import dayjs, { type Dayjs } from 'dayjs';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  selectedDate?: Dayjs | null;
  onDateChange?: (d: Dayjs | null) => void;
}

// This layout wraps every page with the Header (which includes NavbarBreadcrumbs)
export default function Layout({
  children,
  currentPage,
  selectedDate,
  onDateChange,
}: LayoutProps) {
  return (
    <>
      <Header currentPage={currentPage} selectedDate={selectedDate ?? dayjs()} onDateChange={onDateChange} />
      <main style={{ flex: 1, width: '100%' }}>{children}</main>
    </>
  );
}
