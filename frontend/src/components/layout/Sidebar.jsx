import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Folder, CheckSquare, Users, Calendar, X } from 'lucide-react';
import useProjects from '../../hooks/useProjects';
import { deleteProject, updateProject } from '../../api/projectsApi';
import EditProjectModal from '../dashboard/EditProjectModal';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, loading, error, refetch } = useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');

  const navItem = (to, Icon, label) => (
    <Link
      to={to}
      className={`flex items-center py-2 px-3 rounded hover:bg-[#222] ${location.pathname === to ? 'bg-[#333] text-white' : ''}`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </Link>
  );

  const handleEdit = (project) => {
    setEditProject(project);
    setIsModalOpen(true);
  };



  return (
    <aside className="w-56 border-r border-[#222] p-4 bg-[#111] text-white flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Menu</h2>
      <nav className="flex-1 space-y-2">
        {navItem('/', Home, 'Dashboard')}
        {navItem('/projects', Folder, 'Projects')}
        {/* Projects submenu */}
        <div className="pl-4 mt-2 space-y-1">
          {loading && <div className="text-sm text-gray-400">Loading…</div>}
          {error && <div className="text-sm text-red-400">Error loading projects</div>}
          {projects.map((p) => (
            <div key={p.id} className="flex items-center text-sm text-gray-400 hover:text-white cursor-pointer py-1">
              <span onClick={() => navigate(`/projects/${p.id}`)} className="flex-1 truncate">{p.name}</span>
            </div>
          ))}

        </div>
        {navItem('/tasks', CheckSquare, 'My Tasks')}
        {navItem('/teams', Users, 'Teams')}
        {navItem('/calendar', Calendar, 'Calendar')}
      </nav>

      {/* Edit Project Modal */}
      {isModalOpen && editProject && (
        <EditProjectModal
          open={isModalOpen}
          project={editProject}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            await updateProject(editProject.id, data);
            setIsModalOpen(false);
            refetch();
          }}
        />
      )}

      {/* New Project Modal (placeholder) */}
      {isModalOpen && !editProject && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#222] p-6 rounded shadow-lg w-80">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">New Project</h3>
              <X className="cursor-pointer" onClick={() => setIsModalOpen(false)} />
            </div>
            <input
              className="w-full bg-[#333] p-2 rounded mb-4"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button
              onClick={async () => {
                // TODO: integrate createProject API
                setIsModalOpen(false);
                setNewProjectName('');
                refetch();
              }}
              className="w-full bg-blue-600 p-2 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
