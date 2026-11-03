import * as React from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { FlameIcon, KeyRoundIcon, MenuIcon, TriangleAlertIcon } from 'lucide-react'

import { RouteFallback } from '@/components/route-fallback'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { hasApiKey, maskApiKey, useSettings } from '@/lib/config'
import { findNavItem, navGroups } from '@/lib/nav'
import { cn } from '@/lib/utils'

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 px-2 font-semibold tracking-tight">
      <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
        <FlameIcon className="size-4" />
      </span>
      <span>Firecrawl</span>
      <span className="text-muted-foreground text-xs font-normal">playground</span>
    </Link>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-5">
      {navGroups.map(group => (
        <div key={group.title} className="space-y-1">
          <div className="text-muted-foreground px-2 text-[11px] font-semibold tracking-wider uppercase">{group.title}</div>
          {group.items.map(item => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('size-4', isActive && 'text-primary')} />
                  {item.title}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

function ConnectionIndicator() {
  const settings = useSettings()
  const configured = hasApiKey(settings)
  let host = settings.apiUrl
  try {
    host = new URL(settings.apiUrl).host
  } catch {
    // keep raw
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/settings"
          className="hover:bg-muted flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1 text-xs"
        >
          <span
            className={cn('size-2 shrink-0 rounded-full', configured ? 'bg-success' : 'bg-warning')}
            aria-hidden
          />
          <span className="truncate font-mono">{host}</span>
          <KeyRoundIcon className={cn('size-3.5 shrink-0', configured ? 'text-success' : 'text-warning')} />
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        {settings.apiUrl}
        <br />
        {configured ? `API key ${maskApiKey(settings.apiKey)}` : 'No API key configured'}
      </TooltipContent>
    </Tooltip>
  )
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const settings = useSettings()
  const location = useLocation()
  const current = findNavItem(location.pathname)

  React.useEffect(() => {
    document.title = current ? `${current.title} · Firecrawl Playground` : 'Firecrawl Playground'
  }, [current])

  return (
    <div className="bg-background flex min-h-svh">
      <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center border-b px-3">
          <Brand />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-3">
            <NavLinks />
          </div>
        </ScrollArea>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open navigation">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar w-64 p-0">
              <SheetHeader className="border-b">
                <SheetTitle asChild>
                  <div>
                    <Brand />
                  </div>
                </SheetTitle>
                <SheetDescription className="sr-only">Navigation</SheetDescription>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">
                <div className="p-3">
                  <NavLinks onNavigate={() => setMobileOpen(false)} />
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 truncate text-sm font-medium md:hidden">{current?.title ?? 'Firecrawl'}</div>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <ConnectionIndicator />
            <ThemeToggle />
          </div>
        </header>

        {!hasApiKey(settings) && (
          <div className="border-warning/40 bg-warning/10 flex flex-wrap items-center gap-2 border-b px-4 py-2 text-sm md:px-6">
            <TriangleAlertIcon className="text-warning size-4 shrink-0" />
            <span>No API key configured — requests to {settings.apiUrl} will likely fail.</span>
            <Link to="/settings" className="text-primary font-medium underline underline-offset-2">
              Configure in Settings
            </Link>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 p-4 md:p-6">
          <React.Suspense fallback={<RouteFallback />}>
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  )
}

