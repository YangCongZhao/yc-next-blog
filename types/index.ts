export interface Post {
    id: number;
    title: string;
    content: string;
    author: string;
    category: string;
    tags: string;
    views: number;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
