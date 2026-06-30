import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../../components/common/UserAvatar';


export default function ProjectsOverview({ projects, loading }) {
  return (
    <div className="bg-[#161616] border border-[#1e1e1e] rounded-xl flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1e1e1e]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <h2 className="text-[13px] font-semibold text-white">Project Progress Overview</h2>
      </div>

      <div className="px-5 py-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-[#222] rounded w-full"></div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[13px] text-[#444]">No projects found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map(project => {
              const progress = project.progress ?? Math.floor(Math.random() * 100);
              return (
                <Link key={project.id} to={`/projects/${project.id}/board`} className="block group">
                  <div className="flex justify-between items-end mb-1.5">
                    <div className="flex items-center space-x-2">
                      {/* Owner avatar with role */}
                      {project.owner && (
                        <UserAvatar name={project.owner.first_name + ' ' + project.owner.last_name} avatar={project.owner.avatar} size={32} />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-medium text-[#ececec] group-hover:text-white truncate">
                          {project.name}
                        </h4>
                        <p className="text-[11px] text-[#777] truncate">
                          {project.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#aaa] group-hover:text-[#ececec]">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
