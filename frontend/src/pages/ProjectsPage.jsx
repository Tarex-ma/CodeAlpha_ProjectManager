import React, { useEffect, useState } from 'react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/v1/projects/')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading projects…</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((proj) => (
            <li key={proj.id} className="p-2 bg-[#111] rounded">
              <h2 className="text-xl font-semibold">{proj.title || proj.name}</h2>
              <p className="text-gray-400">{proj.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
