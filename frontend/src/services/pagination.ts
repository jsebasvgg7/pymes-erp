export type PaginatedResponse<T> = {
	content: T[];
	totalPages: number;
};

export async function fetchAllPages<T>(
	fetchPage: (page: number, size: number) => Promise<PaginatedResponse<T>>,
	size = 100
): Promise<T[]> {
	const firstPage = await fetchPage(0, size);
	if (firstPage.totalPages <= 1) {
		return firstPage.content;
	}

	const content = [...firstPage.content];
	for (let page = 1; page < firstPage.totalPages; page += 5) {
		const batchSize = Math.min(5, firstPage.totalPages - page);
		const pages = await Promise.all(
			Array.from({ length: batchSize }, (_, index) => fetchPage(page + index, size))
		);
		content.push(...pages.flatMap((response) => response.content));
	}

	return content;
}
