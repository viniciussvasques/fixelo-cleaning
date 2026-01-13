import { prisma } from "@fixelo/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Edit, Timer, DollarSign } from "lucide-react";

export const dynamic = 'force-dynamic';


export default async function AddOnsPage() {
    const addOns = await prisma.addOn.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Add-ons</h1>
                    <p className="text-muted-foreground">Manage extra services and their pricing.</p>
                </div>
                <Button asChild>
                    <Link href="/admin/services/addons/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Add-on
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Add-ons</CardTitle>
                    <CardDescription>
                        These items appear as optional extras during booking.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Time Added</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {addOns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No add-ons found. Create your first one!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                addOns.map((addOn) => (
                                    <TableRow key={addOn.id}>
                                        <TableCell className="font-medium">
                                            {addOn.name}
                                            {addOn.description && (
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {addOn.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{addOn.slug}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm">
                                                <DollarSign className="mr-1 h-3 w-3 text-muted-foreground" />
                                                {addOn.price.toFixed(2)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm">
                                                <Timer className="mr-1 h-3 w-3 text-muted-foreground" />
                                                {addOn.timeAdded} min
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {addOn.isActive ? (
                                                <Badge variant="success">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/services/addons/${addOn.id}`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
