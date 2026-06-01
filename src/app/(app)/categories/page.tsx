import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { getCategories } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { CategoryDialog } from "@/components/inventory/category-dialog";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = (await getCategories()) as Array<{
    _id: string;
    name: string;
    description?: string;
  }>;

  return (
    <div>
      <PageHeader title="Categories" description={`${categories.length} categories`}>
        <CategoryDialog />
      </PageHeader>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No categories"
            description="Create categories to organize your inventory"
            action={<CategoryDialog />}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => (
            <Card key={c._id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
