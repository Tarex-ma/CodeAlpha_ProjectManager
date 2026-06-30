import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Topbar({ onToggleSidebar, isSidebarOpen }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const { logout } = useAuth();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <header className="w-full h-16 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Project Manager
        </h1>
      </div>
      <nav className="flex items-center space-x-4">
        <Link to="/settings" className="text-gray-300 hover:text-white">Settings</Link>
        <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">
          Logout
        </button>
        <button aria-label="Notifications" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">
          🔔
        </button>
        <button aria-label="Toggle Dark Mode" onClick={toggleDarkMode} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">
          🌙
        </button>
      </nav>
    </header>
  );
}



