import { useParams } from 'react-router'

import { BatchJobView } from './components/BatchJobView'

export function BatchJobPage() {
  const { jobId = '' } = useParams()
  // Keyed so pagination / selection state resets when navigating between jobs.
  return <BatchJobView key={jobId} jobId={jobId} />
}
