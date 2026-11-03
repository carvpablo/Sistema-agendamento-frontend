import Link from "next/link";

export default function Header() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar/90 text-sidebar-foreground backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-sidebar-primary hover:opacity-90 transition-opacity"
            >
              Agendamentos!
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/services"
                prefetch={true}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
              >
                Serviços
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <>
              <Link
                href="/auth/user/login"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cliente
              </Link>
              <Link
                href="/auth/professional/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
              >
                Profissional
              </Link>
            </>
          </div>
        </div>
      </header>
    </>
  );
}
