import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCategoryById } from "@/actions/inventory/categories"
import { auth } from "@/auth"
import { env } from "@/env.mjs"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UpdateCategoryForm } from "@/components/forms/inventory/categories/update-category-form"
import { SubSubHeader } from "@/components/nav/subsubheader"

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: "Update Category",
  description: "Update your category",
}

interface AppInventoryCategoriesUpdateCategoryPageProps {
  params: {
    categoryId: number
  }
}

export default async function AppInventoryCategoriesUpdateCategoryPage({
  params,
}: AppInventoryCategoriesUpdateCategoryPageProps): Promise<JSX.Element> {
  const session = await auth()
  if (!session) redirect("/signin")

  const category = await getCategoryById({ id: Number(params.categoryId) })
  if (!category) redirect("/app/inventory/categories")

  return (
    <div>
      <SubSubHeader />
      <div className="p-5">
        <Card className="max-w-5xl rounded-md bg-tertiary">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="text-2xl">Update Category</CardTitle>
            <CardDescription className="text-base">
              Update this category of items
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pt-2">
            <UpdateCategoryForm category={category} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
