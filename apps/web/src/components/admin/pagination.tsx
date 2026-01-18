'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        router.push(`/admin/users?${createQueryString('page', String(page))}`);
    };

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    if (totalPages <= 1) {
        return (
            <div className="text-sm text-muted-foreground text-center py-2">
                Showing {totalItems} users
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
                Showing {startItem} to {endItem} of {totalItems} users
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="gap-1"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </Button>

                <div className="flex items-center gap-1">
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) {
                            page = i + 1;
                        } else if (currentPage <= 3) {
                            page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                        } else {
                            page = currentPage - 2 + i;
                        }

                        return (
                            <Button
                                key={page}
                                variant={page === currentPage ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => goToPage(page)}
                                className="w-8 h-8 p-0"
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="gap-1"
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
