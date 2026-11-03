import { ImageOffIcon } from 'lucide-react'

import type { ImageSearchResult } from '@/lib/api/types'

import { hostOf } from '../result-utils'
import { ResultActions } from './ResultActions'

/** Masonry-ish grid of image results. */
export function ImageResultGrid({ results }: { results: ImageSearchResult[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {results.map((img, i) => (
        <figure key={`${img.imageUrl ?? img.url}-${i}`} className="group overflow-hidden rounded-lg border">
          <a
            href={img.url ?? img.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-muted relative flex aspect-[4/3] items-center justify-center overflow-hidden"
          >
            {img.imageUrl ? (
              <img
                src={img.imageUrl}
                alt={img.title ?? ''}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="size-full object-cover transition-transform group-hover:scale-[1.03]"
              />
            ) : (
              <ImageOffIcon className="text-muted-foreground size-6" />
            )}
            {img.imageWidth && img.imageHeight && (
              <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white tabular-nums">
                {img.imageWidth}×{img.imageHeight}
              </span>
            )}
          </a>
          <figcaption className="space-y-1 p-2">
            <p className="line-clamp-2 text-xs font-medium" title={img.title}>
              {img.title || 'Untitled'}
            </p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-muted-foreground truncate text-[11px]">{hostOf(img.url)}</span>
              <ResultActions url={img.url ?? img.imageUrl} />
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
