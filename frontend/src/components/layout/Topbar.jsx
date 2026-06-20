import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialise from localStorage or system preference
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply or remove 'dark' class on <html> element based on isDarkMode
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);



  const { logout } = useAuth();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      // Redirect to login page after logout
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <header className="w-full h-16 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shadow-md">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Project Manager</h1>
      <nav className="flex items-center space-x-4">
        <a href="#" className="text-gray-300 hover:text-white">Settings</a>
        <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">Logout</button>
        <button aria-label="Notifications" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">🔔</button>
        <button aria-label="Toggle Dark Mode" onClick={toggleDarkMode} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">🌙</button>
      </nav>
    </header>
  );
}
