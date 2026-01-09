import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddOnForm from "../add-on-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewAddOnPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/services/addons">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">New Add-on</h1>
                    <p className="text-muted-foreground">Create a new optional extra service.</p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Add-on Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddOnForm />
                </CardContent>
            </Card>
        </div>
    );
}
