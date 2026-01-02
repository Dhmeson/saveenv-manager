import { ReactNode } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Toaster } from 'sonner'
import {ProjectsProvider } from '../contexts'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
      <ProjectsProvider>
        <div className="relative flex h-screen overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-purple-900">
          <Toaster richColors position="top-right" />

          <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />

          <Sidebar />
          <div className="relative z-10 flex-1 flex flex-col lg:ml-0 isolate">
            <Header />
            <main className="flex-1 overflow-auto p-6 pt-16 md:pt-20">{children}</main>
          </div>
        </div>
      </ProjectsProvider>
  )
}


