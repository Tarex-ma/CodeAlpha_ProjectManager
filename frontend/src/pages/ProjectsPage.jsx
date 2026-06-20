import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useCreateProject } from '../hooks/useCreateProject';
import ProjectsSection from '../components/dashboard/ProjectsSection';
import CreateProjectModal from '../components/dashboard/CreateProjectModal';

export default function ProjectsPage() {
  const { projects, loading, createProject, deleteProject } = useDashboard();
  const modal = useCreateProject(createProject);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <ProjectsSection
        projects={projects}
        loading={loading}
        onOpenModal={modal.openModal}
        onDelete={deleteProject}
      />
      <CreateProjectModal open={modal.open} onClose={modal.closeModal} onSubmit={createProject} />
    </div>
  );
}

