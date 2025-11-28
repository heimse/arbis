import * as React from 'react'
import { MarketingLayout } from '@/components/layout/MarketingLayout'

interface MarketingLayoutWrapperProps {
  children: React.ReactNode
}

export default function MarketingLayoutWrapper({
  children,
}: MarketingLayoutWrapperProps) {
  return <MarketingLayout>{children}</MarketingLayout>
}

