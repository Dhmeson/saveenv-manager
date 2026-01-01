import Link from "next/link";

export function CardActions(){
    return (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative z-10 p-8 md:p-10">
          


          <h1 className="mt-4 bg-gradient-to-br from-white to-white/70 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent md:text-4xl">Dashboard</h1>
       
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link 
              href="/new-project" 
              data-testid="create-new-project-link"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
            >
              Create new project
            </Link>
          
            <Link 
              href="/projects" 
              data-testid="view-projects-link"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/15"
            >
              View projects
            </Link>
          </div>
        </div>
      </div>
    )
}