import * as React from 'react'
import { Link } from 'react-router'
import { CheckCircle2Icon, CircleIcon, KeyRoundIcon, ServerIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Step {
  title: string
  description: React.ReactNode
  done: boolean
  action?: React.ReactNode
}

function StepItem({ step, index }: { step: Step; index: number }) {
  return (
    <li className="flex gap-3">
      <div className="pt-0.5">
        {step.done ? (
          <CheckCircle2Icon className="text-success size-5" aria-label="Done" />
        ) : (
          <CircleIcon className="text-muted-foreground size-5" aria-label="To do" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className={cn('text-sm font-medium', step.done && 'text-muted-foreground line-through')}>
          {index + 1}. {step.title}
        </div>
        <div className="text-muted-foreground text-sm">{step.description}</div>
        {step.action && <div className="pt-1">{step.action}</div>}
      </div>
    </li>
  )
}

interface GettingStartedProps {
  apiUrl: string
  hasRunJob: boolean
}

/** Setup checklist shown while no API key is configured. */
export function GettingStarted({ apiUrl, hasRunJob }: GettingStartedProps) {
  const steps: Step[] = [
    {
      title: 'Point the playground at your API',
      done: true,
      description: (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <ServerIcon className="size-3.5" /> Using
          <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs break-all">{apiUrl}</code>
        </span>
      ),
      action: (
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link to="/settings">Change API URL</Link>
        </Button>
      ),
    },
    {
      title: 'Add your API key',
      done: false,
      description: (
        <>
          Paste your <code className="font-mono text-xs">fc-…</code> key so requests are authenticated. Self-hosted
          without authentication? You can skip this step.
        </>
      ),
      action: (
        <Button asChild size="sm">
          <Link to="/settings">
            <KeyRoundIcon /> Open settings
          </Link>
        </Button>
      ),
    },
    {
      title: 'Run your first scrape',
      done: hasRunJob,
      description: 'Paste a URL in the box above, or open any tool below.',
    },
  ]
  const completed = steps.filter(s => s.done).length

  return (
    <Card className="border-warning/40 gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Get started
          <Badge variant="warning">
            {completed}/{steps.length}
          </Badge>
        </CardTitle>
        <CardDescription>No API key is configured yet — a couple of steps and you&apos;re ready.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <StepItem key={step.title} step={step} index={i} />
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
