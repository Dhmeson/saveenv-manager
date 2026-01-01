"use client"
import Link from 'next/link'
import {  FolderOpen, Plus } from 'lucide-react'
import { CardActions } from '@/app/components/Dashboard/CardActions'

export default function DashboardHomePage() {

  return (
    <div className="space-y-6">
      <CardActions/>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
     

        <Link href="/projects" className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur transition hover:bg-white/10">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-emerald-300 transition group-hover:scale-110" />
            <div>
              <h3 className="text-lg font-semibold text-white">Projects</h3>
              <p className="text-sm text-white/70">Organize and protect variables by project.</p>
            </div>
          </div>
        </Link>

        <Link href="/new-project" className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur transition hover:bg-white/10">
          <div className="flex items-center gap-3">
            <Plus className="h-8 w-8 text-indigo-300 transition group-hover:scale-110" />
            <div>
              <h3 className="text-lg font-semibold text-white">New Project</h3>
              <p className="text-sm text-white/70">Create a project and add variables.</p>
            </div>
          </div>
        </Link>
      </div>

    </div>
  )
}


