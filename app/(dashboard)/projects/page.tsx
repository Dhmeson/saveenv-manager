'use client'
import { useEffect, useRef, useState } from 'react'
import { StoredProject } from '@prisma/client'
import { ViewProject } from '@/app/components/Project/ViewProject'
import { EditProject } from '@/app/components/Project/EditProject'
import { ProjectsList } from '@/app/components/Project/ProjectsList'
import { useProjects } from '@/app/contexts'
import Link from 'next/link'
import { ENVIRONMENTS } from '@/app/components/FolderIcon'
import { Circle } from 'lucide-react'


// Importar a tipagem do contexto

export default function ProjectsPage() {
  const [viewProject, setViewProject] = useState<StoredProject | null>(null)
  const [editProject, setEditProject] = useState<StoredProject | null>(null)
  const [searchText, setSearchText] = useState('')
  const [envFilter, setEnvFilter] = useState<'all' | 'default' | 'development' | 'staging' | 'production'>('all')
  const [envOpen, setEnvOpen] = useState(false)
  const envPickerRef = useRef<HTMLDivElement | null>(null)

  const { projects } = useProjects()

  type ProjectWithEnv = typeof projects[number] & { environment?: string | null }
  const filteredProjects = (projects as ProjectWithEnv[]).filter((p) => {
    const nameOk = p.name.toLowerCase().includes(searchText.toLowerCase())
    const env = (p.environment || 'default') as 'default' | 'development' | 'staging' | 'production'
    const envOk = envFilter === 'all' ? true : env === envFilter
    return nameOk && envOk
  })

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!envPickerRef.current) return
      if (!envPickerRef.current.contains(e.target as Node)) {
        setEnvOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="bg-linear-to-br from-white to-white/70 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">
          Projects
        </h1>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name"
              className="h-9 rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
            />
            <div className="relative" ref={envPickerRef}>
              <button
                type="button"
                onClick={() => setEnvOpen(v => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 h-9 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/15"
                aria-haspopup="listbox"
                aria-expanded={envOpen}
              >
                {envFilter === 'all' ? (
                  <>
                    <Circle className="w-4 h-4" style={{ color: '#9ca3af' }} />
                    <span>All</span>
                  </>
                ) : (
                  <>
                    {(() => {
                      const Meta = ENVIRONMENTS[envFilter]
                      const IconComp = Meta.Icon as React.ComponentType<{ className?: string }>
                      return (
                        <span style={{ color: Meta.color }}>
                          <IconComp className="w-4 h-4" />
                        </span>
                      )
                    })()}
                    <span>{ENVIRONMENTS[envFilter].label}</span>
                  </>
                )}
              </button>
              {envOpen && (
                <div className="absolute right-0 z-50 mt-2 max-h-64 w-48 overflow-auto rounded-lg border border-white/10 bg-slate-900/90 p-1 shadow-2xl backdrop-blur">
                  <ul role="listbox" className="space-y-1">
                    <li>
                      <button
                        type="button"
                        onClick={() => { setEnvFilter('all'); setEnvOpen(false) }}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/90 hover:bg-white/10 ${envFilter === 'all' ? 'bg-white/10' : ''}`}
                        role="option"
                        aria-selected={envFilter === 'all'}
                      >
                        <Circle className="w-4 h-4" style={{ color: '#9ca3af' }} />
                        <span>All</span>
                      </button>
                    </li>
                    {Object.entries(ENVIRONMENTS).map(([value, meta]) => {
                      const IconComp = meta.Icon as React.ComponentType<{ className?: string }>
                      return (
                        <li key={value}>
                          <button
                            type="button"
                            onClick={() => { setEnvFilter(value as typeof envFilter); setEnvOpen(false) }}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/90 hover:bg-white/10 ${envFilter === value ? 'bg-white/10' : ''}`}
                            role="option"
                            aria-selected={envFilter === value}
                          >
                            <span style={{ color: meta.color }}>
                              <IconComp className="w-4 h-4" />
                            </span>
                            <span>{meta.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-white/80">{filteredProjects.length} project(s) found</div>
          <Link
            href="/new-project"
            data-testid="create-new-project-link"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
          >
            Create new project
          </Link>
        </div>
      </div>

     {projects.length === 0 ? (
       <div className="flex flex-col items-center justify-center py-24 text-center">
         <h2 className="text-xl font-semibold text-white">Start your first project</h2>
         <p className="mt-3 max-w-xl text-white/70">
           Projects help you securely organize environment variables for each app or service you build.
           Add encrypted variables, invite teammates, manage roles and keep everything in one place.
         </p>
         <ul className="mt-4 max-w-xl text-left text-sm text-white/70 space-y-1 list-disc list-inside">
           <li>Store and encrypt variables (.env) per project.</li>
           <li>Create separate values for development, staging and production.</li>
           <li>Invite teammates and control access with roles.</li>
           <li>Rotate secrets safely and keep changes auditable.</li>
         </ul>
         <Link
           href="/new-project"
           data-testid="empty-create-project-button"
           className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
         >
           Create new project
         </Link>
       </div>
     ) : filteredProjects.length === 0 ? (
       <div className="flex flex-col items-center justify-center py-24 text-center">
         <h2 className="text-xl font-semibold text-white">No projects found</h2>
         <p className="mt-3 max-w-xl text-white/70">Try changing the search or environment filters.</p>
       </div>
     ) : (
       <ProjectsList projects={filteredProjects} setEditProject={setEditProject} setViewProject={setViewProject}/>
     )}

{
  viewProject &&    
   <ViewProject 
        viewProject={viewProject} 
        setViewProject={setViewProject} 
        />
}
   
      {editProject && (<EditProject editProject={editProject} setEditProject={setEditProject} />)}

    </div>
  )
}


