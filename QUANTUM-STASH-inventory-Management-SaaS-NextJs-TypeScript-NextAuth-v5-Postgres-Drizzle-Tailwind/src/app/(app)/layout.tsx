import * as React from "react"

import { Header } from "@/components/nav/app/header"
import { Sidebar } from "@/components/nav/app/sidebar"
import { DashboardOnboarding } from "@/components/dashboard-onboarding"

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    <div className="flex">
      <Sidebar />
      <div className="h-screen w-full overflow-y-auto">
        <Header />
        <DashboardOnboarding />
        <main>{children}</main>
      </div>
    </div>
  )
}
