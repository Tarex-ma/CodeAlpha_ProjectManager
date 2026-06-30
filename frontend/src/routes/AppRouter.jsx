// src/routes/AppRouter.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import AppShell from '../components/layout/AppShell';
import AuthLayout from '../components/layout/AuthLayout';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import BoardPage from '../pages/BoardPage';
import MyTasksPage from '../pages/MyTasksPage';
import TeamsPage from '../pages/TeamsPage';
import CalendarPage from '../components/calendar/CalendarPage.jsx';
import SettingsLayout from "../components/settings/SettingsLayout.jsx";
import ProfileSettings from "../components/settings/ProfileSettings.jsx";
import AccountSettings from "../components/settings/AccountSettings.jsx";
import AppearanceSettings from "../components/settings/AppearanceSettings.jsx";
import NotificationSettings from "../components/settings/NotificationSettings.jsx";
import LanguageRegionSettings from "../components/settings/LanguageRegionSettings.jsx";
import SecuritySettings from "../components/settings/SecuritySettings.jsx";
import PreferencesSettings from "../components/settings/PreferencesSettings.jsx";
import AboutSettings from "../components/settings/AboutSettings.jsx";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:id', element: <BoardPage /> },
          { path: '/tasks', element: <MyTasksPage /> },
          { path: '/teams', element: <TeamsPage /> },
          { path: '/calendar', element: <CalendarPage /> },
          {
        path: '/settings',
        element: <SettingsLayout />, 
        children: [
          { path: 'profile', element: <ProfileSettings /> },
          { path: 'account', element: <AccountSettings /> },
          { path: 'appearance', element: <AppearanceSettings /> },
          { path: 'notifications', element: <NotificationSettings /> },
          { path: 'language', element: <LanguageRegionSettings /> },
          { path: 'security', element: <SecuritySettings /> },
          { path: 'preferences', element: <PreferencesSettings /> },
          { index: true, element: <Navigate to="profile" replace />, },
{ path: 'about', element: <AboutSettings /> },
        ],
      },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);