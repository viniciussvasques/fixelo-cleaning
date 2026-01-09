import { prisma } from "@fixelo/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddOnForm from "../add-on-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";
import { deleteAddOn } from "../actions";

export default async function EditAddOnPage({ params }: { params: { id: string } }) {
    const addOn = await prisma.addOn.findUnique({
        where: { id: params.id }
    });

    if (!addOn) {
        redirect("/admin/services/addons");
    }

    async function handleDelete() {
        "use server";
        await deleteAddOn(params.id);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/services/addons">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Add-on</h1>
                        <p className="text-muted-foreground">{addOn.name}</p>
                    </div>
                </div>
                <form action={handleDelete}>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Add-on
                    </Button>
                </form>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Add-on Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddOnForm addOn={addOn} />
                </CardContent>
            </Card>
        </div>
    );
}
