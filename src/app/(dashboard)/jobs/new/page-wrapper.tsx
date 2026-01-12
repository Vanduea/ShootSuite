/**
 * Wrapper for New Job Page with Suspense
 */

import { Suspense } from 'react'
import NewJobPage from './page'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NewJobPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewJobPage />
    </Suspense>
  )
}

