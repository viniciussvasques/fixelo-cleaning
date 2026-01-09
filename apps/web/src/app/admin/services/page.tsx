import Link from "next/link";
import { prisma } from "@fixelo/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simple Badge component since it's missing in ui folder
function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
            {active ? "Active" : "Inactive"}
        </span>
    );
}

export default async function ServicesPage() {
    const services = await prisma.serviceType.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
                <Button asChild>
                    <Link href="/admin/services/new">Add Service</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Services</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Base Price</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Duration (min)</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {services.map((service) => (
                                    <tr key={service.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{service.name}</td>
                                        <td className="p-4 align-middle">${service.basePrice.toFixed(2)}</td>
                                        <td className="p-4 align-middle">{service.baseTime}</td>
                                        <td className="p-4 align-middle">
                                            <StatusBadge active={service.isActive} />
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/services/${service.id}`}>Edit</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
