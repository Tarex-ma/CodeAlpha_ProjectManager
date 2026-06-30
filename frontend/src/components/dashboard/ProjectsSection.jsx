import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import EditProjectModal from './EditProjectModal';
import { updateProject } from '../../api/projectsApi';
import { ProjectCardSkeleton } from '../common/Skeleton';

const FILTERS = [
  { key: 'all',       label: 'All'       },
  { key: 'active',    label: 'Active'    },
  { key: 'on_hold',   label: 'On Hold'   },
  { key: 'completed', label: 'Completed' },
];

/**
 * ProjectsSection
 *
 * Props:
 *   projects    – array of project objects
 *   loading     – boolean
 *   onOpenModal – () => void  (open CreateProjectModal)
 *   onDelete    – (id) => void
 */
export default function ProjectsSection({ projects, loading, onOpenModal, onDelete }) {
  const navigate        = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editProject, setEditProject] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleEdit = (project) => {
    setEditProject(project);
    setEditOpen(true);
  };

  const filtered = useMemo(() => {
    let list = projects;
    if (filter !== 'all') list = list.filter((p) => p.status === filter);
    if (search.trim())    list = list.filter((p) =>
      (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [projects, filter, search]);

  // Count per status for badge numbers
  const counts = useMemo(() => {
    const c = { all: projects.length };
    projects.forEach((p) => { c[p.status] = (c[p.status] ?? 0) + 1; });
    return c;
  }, [projects]);

  return (
    <section>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          <h2 className="text-[14px] font-semibold text-white">Projects</h2>
          {!loading && (
            <span className="px-1.5 py-0.5 bg-[#1e1e1e] rounded text-[10px] text-[#555]">
              {projects.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none"
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-40 bg-[#161616] border border-[#1e1e1e] rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-white placeholder:text-[#333] outline-none focus:border-[#2a2a2a] transition-colors"
            />
          </div>

          {/* New project button */}
          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2196f3] hover:bg-[#1976d2] text-white text-[12px] font-medium rounded-lg transition-colors active:scale-[0.98]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New project
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap ${
              filter === key
                ? 'bg-[#1e2a3a] text-[#2196f3]'
                : 'text-[#555] hover:text-[#aaa] hover:bg-[#161616]'
            }`}
          >
            {label}
            {counts[key] != null && counts[key] > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${filter === key ? 'bg-[#2196f3]/20 text-[#2196f3]' : 'bg-[#1e1e1e] text-[#444]'}`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#161616] border border-[#1e1e1e] border-dashed rounded-xl">
          <div className="w-12 h-12 bg-[#1e1e1e] rounded-xl flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
          </div>
          <p className="text-[14px] text-[#555] mb-1">
            {search ? 'No projects match your search' : 'No projects yet'}
          </p>
          <p className="text-[12px] text-[#333] mb-5">
            {search ? 'Try a different search term' : 'Create your first project to get started'}
          </p>
          {!search && (
            <button
              onClick={onOpenModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2196f3] hover:bg-[#1976d2] text-white text-[12px] font-medium rounded-lg transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={onDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
      {editOpen && editProject && (
        <EditProjectModal
          open={editOpen}
          project={editProject}
          onClose={() => setEditOpen(false)}
          onSubmit={async (data) => {
            await updateProject(editProject.id, data);
            setEditOpen(false);
            // Refetch projects after edit
            if (typeof refetch === 'function') refetch();
          }}
        />
      )}
    </section>
  );
}