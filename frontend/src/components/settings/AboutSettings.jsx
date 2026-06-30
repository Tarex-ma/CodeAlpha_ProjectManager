// src/components/settings/AboutSettings.jsx
import React from "react";

export default function AboutSettings() {
  const appVersion = "1.0.0";
  const currentYear = new Date().getFullYear();

  return (
    <section className="p-6 prose prose-indigo dark:prose-invert max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-4">About ProjectManager</h1>
      <p>
        ProjectManager is a modern, collaborative task‑management platform designed to help teams organise
        their work, track progress, and stay aligned. It combines a clean, responsive UI with powerful
        features such as real‑time boards, calendars, and customizable dashboards.
      </p>
      <ul className="list-disc ml-5">
        <li><strong>Version:</strong> {appVersion}</li>
        <li><strong>Built with:</strong> React, Vite, Tailwind CSS, Django REST Framework</li>
        <li><strong>Author:</strong> Your Company Name</li>
        <li><strong>License:</strong> MIT</li>
      </ul>
      <footer className="mt-8 text-sm text-gray-600 dark:text-gray-400">
        © {currentYear} Your Company. All rights reserved.
      </footer>
    </section>
  );
}
