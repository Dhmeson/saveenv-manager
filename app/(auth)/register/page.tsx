import { RegisterForm } from "@/app/components/Register/RegisterForm";
import { RegisterFormSkeleton } from "@/app/components/Register/RegisterFormSkeleton";
import { Shield } from "lucide-react";
import { Suspense } from "react";

// Componente principal
export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900">
      <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10">
              <Shield className="h-8 w-8 text-indigo-300" />
            </div>
            <h1 className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">Create account</h1>
            <p className="text-sm text-white/70">Sign up to get started</p>
          </div>

          <Suspense fallback={<RegisterFormSkeleton />}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}