import { AppWindowIcon, ArrowLeftIcon, FilmIcon, MonitorIcon, SquareTerminalIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { CopyButton, EmptyState, ErrorAlert, PageHeader, StatusBadge } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useBrowserSession } from './api'
import { DeleteSessionButton } from './components/DeleteSessionButton'
import { ExecuteConsole } from './components/ExecuteConsole'
import { LiveView } from './components/LiveView'
import { ReplayPanel } from './components/ReplayPanel'
import { SessionInfo } from './components/SessionInfo'

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link to="/browser">
        <ArrowLeftIcon /> All sessions
      </Link>
    </Button>
  )
}

export function BrowserSessionPage() {
  const { sessionId = '' } = useParams()
  const { list, session, expiresAt } = useBrowserSession(sessionId)

  if (!session && list.isPending) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <BackLink />
        {list.isError ? (
          <ErrorAlert error={list.error} title="Could not load session" onRetry={() => void list.refetch()} />
        ) : (
          <EmptyState
            icon={AppWindowIcon}
            title="Session not found"
            description={
              <>
                No session with ID <code className="font-mono text-xs">{sessionId}</code> exists for this API key.
              </>
            }
            action={
              <Button asChild variant="outline">
                <Link to="/browser">Back to sessions</Link>
              </Button>
            }
          />
        )}
      </div>
    )
  }

  const active = session.status === 'active'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink />
        <PageHeader
          icon={AppWindowIcon}
          title={
            <span className="flex flex-wrap items-center gap-2">
              Browser session <StatusBadge status={session.status} />
            </span>
          }
          description={
            <span className="flex items-center gap-1 font-mono text-xs">
              {session.id}
              <CopyButton value={session.id} toastMessage="Session ID copied" />
            </span>
          }
          actions={active ? <DeleteSessionButton sessionId={session.id} /> : undefined}
        />
      </div>

      {list.isError && (
        <ErrorAlert error={list.error} title="Could not refresh session status" onRetry={() => void list.refetch()} />
      )}

      <SessionInfo session={session} expiresAt={expiresAt} />

      <Tabs defaultValue={active ? 'console' : 'replay'}>
        <TabsList>
          <TabsTrigger value="console">
            <SquareTerminalIcon /> Console
          </TabsTrigger>
          <TabsTrigger value="live">
            <MonitorIcon /> Live view
          </TabsTrigger>
          <TabsTrigger value="replay">
            <FilmIcon /> Replay
          </TabsTrigger>
        </TabsList>
        <TabsContent value="console" className="pt-2">
          <ExecuteConsole sessionId={session.id} disabled={!active} />
        </TabsContent>
        <TabsContent value="live" className="pt-2">
          <LiveView session={session} />
        </TabsContent>
        <TabsContent value="replay" className="pt-2">
          <ReplayPanel sessionId={session.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
