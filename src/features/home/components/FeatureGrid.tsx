import { Link } from 'react-router'
import { ArrowUpRightIcon } from 'lucide-react'

import { featureEntries } from '../lib'

/** One card per tool page, taken from the app navigation. */
export function FeatureGrid() {
  return (
    <section className="space-y-3" aria-labelledby="home-tools-heading">
      <h2 id="home-tools-heading" className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Tools
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {featureEntries.map(item => (
          <Link
            key={item.href}
            to={item.href}
            className="group bg-card hover:border-primary/40 focus-visible:ring-ring/50 relative flex gap-3 rounded-xl border p-4 shadow-sm transition-colors outline-none hover:shadow-md focus-visible:ring-[3px]"
          >
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <item.icon className="size-4.5" />
            </div>
            <div className="min-w-0 space-y-0.5 pr-4">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground text-[10px] tracking-wider uppercase">{item.group}</span>
              </div>
              <p className="text-muted-foreground line-clamp-2 text-sm">{item.description}</p>
            </div>
            <ArrowUpRightIcon className="text-muted-foreground group-hover:text-primary absolute top-3 right-3 size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  )
}
