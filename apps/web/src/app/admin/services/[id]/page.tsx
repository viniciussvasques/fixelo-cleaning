import { prisma } from "@fixelo/database";
import ServiceForm from "../service-form";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function EditServicePage({ params }: { params: { id: string } }) {
    // If 'new', simple return empty form
    if (params.id === 'new') {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Create New Service</h1>
                <Card>
                    <CardContent className="pt-6">
                        <ServiceForm />
                    </CardContent>
                </Card>
            </div>
        );
    }

    const service = await prisma.serviceType.findUnique({
        where: { id: params.id }
    });

    if (!service) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Edit Service</h1>
            <Card>
                <CardContent className="pt-6">
                    <ServiceForm service={service} />
                </CardContent>
            </Card>
        </div>
    );
}
