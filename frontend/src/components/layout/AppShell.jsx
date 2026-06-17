import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NotificationProvider from '../Notification';

export default function AppShell() {
  return (
    <div className="min-h-screen flex bg-[#0f0f0f] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <NotificationProvider />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}