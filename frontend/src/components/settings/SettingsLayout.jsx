// src/components/settings/SettingsLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import "./settings.css";
import { FaUser, FaLock, FaPalette, FaBell, FaGlobe, FaShieldAlt, FaSlidersH, FaInfoCircle } from 'react-icons/fa';

// Navigation items for each settings section
const navItems = [
  { to: 'profile', label: 'Profile', icon: <FaUser /> },
  { to: 'account', label: 'Account', icon: <FaLock /> },
  { to: 'appearance', label: 'Appearance', icon: <FaPalette /> },
  { to: 'notifications', label: 'Notifications', icon: <FaBell /> },
  { to: 'language', label: 'Language & Region', icon: <FaGlobe /> },
  { to: 'security', label: 'Security', icon: <FaShieldAlt /> },
  { to: 'preferences', label: 'Preferences', icon: <FaSlidersH /> },
  { to: 'about', label: 'About', icon: <FaInfoCircle /> },
];

/**
 * SettingsLayout renders a premium‑styled settings page with a sidebar navigation
 * (desktop) and a top tab bar (mobile). It uses <Outlet/> for nested routes.
 */
export default function SettingsLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-[250px_1fr] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar navigation */}
      <nav className="hidden md:flex flex-col border-r border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Settings</h2>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors 
                  ${isActive ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                `
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile navigation */}
      <nav className="md:hidden flex items-center justify-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2">
        <ul className="flex gap-4">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center text-sm transition-colors 
                  ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}
                `
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content area */}
      <main className="p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
