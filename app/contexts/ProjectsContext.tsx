"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { StoredProject, ProjectEnvVar } from '@prisma/client'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface ProjectWithDetails extends StoredProject {
  variables: ProjectEnvVar[]
}

interface ProjectsContextType {
  projects: ProjectWithDetails[]
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  updateProject: (id: number, projectData: UpdateProjectData) => Promise<ProjectWithDetails | null>
  updateProjectWithVariables: (id: number, projectData: UpdateProjectWithVariablesData) => Promise<ProjectWithDetails | null>
  deleteProject: (id: number) => Promise<boolean>
  getProjectById: (id: number) => ProjectWithDetails | undefined
  addVariable: (projectId: number, variableData: CreateVariableData) => Promise<boolean>
  updateVariable: (projectId: number, variableId: string, variableData: UpdateVariableData) => Promise<boolean>
  deleteVariable: (projectId: number, variableId: string) => Promise<boolean>
}


interface UpdateProjectData {
  name?: string
  description?: string
}

interface UpdateProjectWithVariablesData {
  name?: string
  description?: string
  variables?: CreateVariableData[]
}

interface CreateVariableData {
  name: string
  encrypted: string
}

interface UpdateVariableData {
  name?: string
  encrypted?: string
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects_, setProjects] = useState<ProjectWithDetails[]>([])
  const [error, setError] = useState<string | null>(null)

  const {
    data: projects = [],
    refetch: refetchProjects,
    isLoading: loading,
  } = useQuery<ProjectWithDetails[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
     
      const data = await response.json()
      return data.projects || []
    },
    refetchOnWindowFocus: true,
    staleTime:Infinity,
  })

  const queryClient = useQueryClient()




  const updateProject = async (id: number, projectData: UpdateProjectData): Promise<ProjectWithDetails | null> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })
      
          if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update project')
        }
      
      const updatedProject = await response.json()
      setProjects(prev => prev.map(project => project.id === id ? updatedProject : project))
      toast.success('Projeto atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      return updatedProject
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      setError(message)
      toast.error(`Erro ao atualizar projeto: ${message}`)
      return null
    } 
  }

  const updateProjectWithVariables = async (id: number, projectData: UpdateProjectWithVariablesData): Promise<ProjectWithDetails | null> => {
    try {
      setError(null)
      
      // Primeiro atualiza o projeto base
      const { variables, ...projectBaseData } = projectData
      let updatedProject: ProjectWithDetails | null = null
      
      if (Object.keys(projectBaseData).length > 0) {
        const response = await fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectBaseData)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update project')
        }
        
        updatedProject = await response.json()
      }
      
             // Depois atualiza as variáveis se fornecidas
       if (variables && variables.length > 0) {
         // Remove todas as variáveis existentes e adiciona as novas
         const response = await fetch(`/api/projects`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ id, variables })
         })
         
         if (!response.ok) {
           const errorData = await response.json()
           throw new Error(errorData.error || 'Falha ao atualizar variáveis')
         }
         
         const updatedProjectWithVars = await response.json()
         updatedProject = updatedProjectWithVars
       }
      
      if (updatedProject) {
        setProjects(prev => prev.map(project => project.id === id ? updatedProject : project))
        toast.success('Projeto e variáveis atualizados com sucesso!')
        return updatedProject
      }
      
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      setError(message)
      toast.error(`Erro ao atualizar projeto: ${message}`)
      return null
    } 
  }

  const deleteProject = async (id: number): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao deletar projeto')
      }
      
      setProjects(prev => prev.filter(project => project.id !== id))
      toast.success('Projeto deletado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['projects'] })

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      setError(message)
      toast.error(`Erro ao deletar projeto: ${message}`)
      return false
    } 
  }

  const getProjectById = (id: number): ProjectWithDetails | undefined => {
    return projects_?.find(project => project.id === id)
  }



  const addVariable = async (projectId: number, variableData: CreateVariableData): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/variables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variableData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao adicionar variável')
      }
      
      const newVariable = await response.json()
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, variables: [...project.variables, newVariable] }
          : project
      ))
      toast.success('Variável adicionada com sucesso!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      setError(message)
      toast.error(`Erro ao adicionar variável: ${message}`)
      return false
    } 
  }

  const updateVariable = async (projectId: number, variableId: string, variableData: UpdateVariableData): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/variables/${variableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variableData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao atualizar variável')
      }
      
      const updatedVariable = await response.json()
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { 
              ...project, 
              variables: project.variables.map(v => v.id === variableId ? updatedVariable : v)
            }
          : project
      ))
      toast.success('Variável atualizada com sucesso!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      setError(message)
      toast.error(`Erro ao atualizar variável: ${message}`)
      return false
    } 
  }

  const deleteVariable = async (projectId: number, variableId: string): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch(`/api/projects/${projectId}/variables/${variableId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao deletar variável')
      }
      
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, variables: project.variables.filter(v => v.id !== variableId) }
          : project
      ))
      toast.success('Variável deletada com sucesso!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      setError(message)
      toast.error(`Erro ao deletar variável: ${message}`)
      return false
    } 
  }

  // Buscar projetos ao montar o componente
  useEffect(() => {
    // fetchProjects()
    refetchProjects()
  }, [refetchProjects])

  const value: ProjectsContextType = {
    projects,
    loading,
    error,
    fetchProjects:async()=>{
      refetchProjects()
    },
    updateProject,
    updateProjectWithVariables,
    deleteProject,
    getProjectById,
    addVariable,
    updateVariable,
    deleteVariable
  }

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error('useProjects deve ser usado dentro de um ProjectsProvider')
  }
  return context
}
