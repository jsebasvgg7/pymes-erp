export type PaginatedResponse<T> = {
    content: T[];
    totalPages: number;
};

const MAX_PAGES = 20;
const BATCH_SIZE = 5;

export async function fetchAllPages<T>(
    fetchPage: (page: number, size: number) => Promise<PaginatedResponse<T>>,
    size = 200
): Promise<T[]> {
    const firstPage = await fetchPage(0, size);
    const totalPages = Math.min(firstPage.totalPages, MAX_PAGES);

    if (totalPages <= 1) {
        return firstPage.content;
    }

    const content = [...firstPage.content];
    for (let page = 1; page < totalPages; page += BATCH_SIZE) {
        const batchSize = Math.min(BATCH_SIZE, totalPages - page);
        const pages = await Promise.all(
            Array.from({ length: batchSize }, (_, index) => fetchPage(page + index, size))
        );
        content.push(...pages.flatMap((response) => response.content));
    }

    return content;
}
