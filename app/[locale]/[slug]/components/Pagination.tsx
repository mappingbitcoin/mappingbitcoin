"use client";

import { useTranslations } from "next-intl";
import { ChevronLeftIcon, ChevronRightIcon } from "@/assets/icons/ui";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    filteredCount: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (perPage: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    filteredCount,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
}: PaginationProps) {
    const t = useTranslations();

    if (filteredCount === 0) return null;

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
            {/* Left: Per Page Selector (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                <label htmlFor="perPage" className="text-xs text-text-light whitespace-nowrap">
                    {t("countries.perPage.label")}
                </label>
                <select
                    id="perPage"
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="py-1.5 px-2 bg-surface border border-border-light rounded-btn text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
                >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>

            {/* Center: Page Navigation */}
            {totalPages > 1 ? (
                <div className="flex items-center gap-1 md:gap-2">
                    {/* Previous Button */}
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 flex items-center justify-center rounded-btn text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-surface border border-border-light text-white hover:bg-surface-light cursor-pointer"
                    >
                        <ChevronLeftIcon className="w-4 h-4 md:hidden" />
                        <span className="hidden md:inline">{t("countries.pagination.previous")}</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                if (page === 1 || page === totalPages) return true;
                                return Math.abs(page - currentPage) <= 1;
                            })
                            .map((page, idx, arr) => {
                                const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                                return (
                                    <span key={page} className="flex items-center">
                                        {showEllipsisBefore && (
                                            <span className="px-1 md:px-2 text-text-light text-xs">...</span>
                                        )}
                                        <button
                                            onClick={() => onPageChange(page)}
                                            className={`w-8 h-8 rounded-btn text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer ${
                                                currentPage === page
                                                    ? "bg-accent text-white"
                                                    : "bg-surface border border-border-light text-white hover:bg-surface-light"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    </span>
                                );
                            })}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 flex items-center justify-center rounded-btn text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-surface border border-border-light text-white hover:bg-surface-light cursor-pointer"
                    >
                        <ChevronRightIcon className="w-4 h-4 md:hidden" />
                        <span className="hidden md:inline">{t("countries.pagination.next")}</span>
                    </button>
                </div>
            ) : (
                <div />
            )}

            {/* Right: Showing Stats (hidden on mobile) */}
            <div className="hidden md:block text-xs text-text-light text-right min-w-[120px]">
                {filteredCount !== totalItems ? (
                    <span>{t("countries.stats.filtered", { count: filteredCount })}</span>
                ) : filteredCount > 0 ? (
                    <span>
                        {t("countries.stats.showingPage", {
                            start: ((currentPage - 1) * itemsPerPage + 1).toLocaleString(),
                            end: Math.min(currentPage * itemsPerPage, filteredCount).toLocaleString(),
                            total: filteredCount.toLocaleString(),
                        })}
                    </span>
                ) : null}
            </div>

            {/* Mobile: Compact Stats */}
            <div className="md:hidden text-xs text-text-light text-center">
                {filteredCount > 0 && (
                    <span>{currentPage} / {totalPages}</span>
                )}
            </div>
        </div>
    );
}
