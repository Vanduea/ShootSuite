/**
 * Wrapper for New Job Page with Suspense
 */

import { Suspense } from 'react'
import NewJobPageContent from './page-content'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NewJobPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewJobPageContent />
    </Suspense>
  )
}

