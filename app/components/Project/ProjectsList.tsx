import React from "react";
import { StoredProject } from "@prisma/client";
import { FolderOpen } from "lucide-react"
import { ICONS, ENVIRONMENTS } from "@/app/components/FolderIcon";
import type { ProjectWithDetails } from "@/app/contexts/ProjectsContext";


interface Props{
    setViewProject:(project: StoredProject | null) => void;
    projects: ProjectWithDetails[];
    setEditProject:(project: StoredProject | null) => void;
}

export function ProjectsList({projects,setViewProject,setEditProject}:Props){

    return (
        <>
      <div className="z-30 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur transition hover:bg-white/10"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {project.folderIcon && ICONS[project.folderIcon]?.Icon ? (
                  <span
                    className="h-8 w-8 transition group-hover:scale-110 inline-flex items-center justify-center"
                    style={{ color: ICONS[project.folderIcon].color }}
                  >
                    {React.createElement(
                      ICONS[project.folderIcon].Icon as React.ComponentType<{ className?: string }>,
                      { className: 'h-8 w-8' }
                    )}
                  </span>
                ) : (
                  <FolderOpen className="h-8 w-8 text-emerald-300 transition group-hover:scale-110" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                  <p className="text-sm text-white/60">Created on {project.createdAt ? new Intl.DateTimeFormat(navigator.language, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }).format(new Date(project.createdAt)) : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
          
              <div className="flex justify-between">
                <span className="text-white/70">Variables:</span>
                <span className="font-medium text-white">{project.variables?.length || 0}</span>
              </div>
              {(() => {
                const env = ((project as unknown) as { environment?: string }).environment ?? 'default'
                if (env === 'default') return null
                const meta = ENVIRONMENTS[env as keyof typeof ENVIRONMENTS]
                if (!meta) return null
                const IconComp = meta.Icon as React.ComponentType<{ className?: string }>
                return (
                  <div className="flex items-center gap-2">
                   
                    <span style={{ color: meta.color }}>
                      <IconComp className="h-4 w-4" />
                    </span>
                    <span className="text-white/90">{meta.label}</span>
                  </div>
                )
              })()}
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                data-testid={`view-project-${project.id}`}
                className="rounded-lg bg-indigo-500 px-3 py-1 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400"
                onClick={() => {
                  setViewProject(project)
                }}
              >
                View
              </button>
              <button
                data-testid={`edit-project-${project.id}`}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
                onClick={() => {
                  setEditProject(project)
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

   
    </>
  )
}