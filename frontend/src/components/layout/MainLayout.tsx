import React, { useState } from 'react';
import type { ReactNode } from 'react';
import Header from '@/components/common/Header';
import Sidebar from '@/components/common/Sidebar';

const MainLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Header onMenuToggle={toggleSidebar} />

        <main className="p-4 lg:p-6 max-w-[1700px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
