import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NotificationProvider from '../Notification';

import { useState } from 'react';


export default function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen flex gap-6 bg-[#0f0f0f] text-white">
      {isSidebarOpen && <Sidebar />}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4">
        <Topbar onToggleSidebar={toggleSidebar} />
        <NotificationProvider />
        <main className="flex-1 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}