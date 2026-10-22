export type PaginatedResponse<T> = {
    content: T[];
    totalPages: number;
};

export async function fetchAllPages<T>(
    fetchPage: (page: number, size: number) => Promise<PaginatedResponse<T>>,
    size = 50
): Promise<T[]> {
    // Solicitamos únicamente la primera página de resultados
    const firstPage = await fetchPage(0, size);

    return firstPage.content;
}
