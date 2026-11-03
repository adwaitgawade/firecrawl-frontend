import { Link } from 'react-router'
import { CompassIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="py-10">
      <EmptyState
        icon={CompassIcon}
        title="Page not found"
        description="The page you are looking for doesn't exist."
        action={
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
        }
      />
    </div>
  )
}
