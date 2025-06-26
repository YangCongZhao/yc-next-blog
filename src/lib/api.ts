const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export interface CreatePostRequest {
    title: string;
    content: string;
    author?: string;
    category?: string;
    tags?: string;
}

export type UpdatePostRequest = Partial<CreatePostRequest>

export interface PostsResponse {
    posts: Post[];
    total: number;
    page: number;
    limit: number;
}

export interface QueryParams {
    search?: string;
    category?: string;
    author?: string;
    page?: number;
    limit?: number;
}

class ApiService {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // 处理 204 No Content 响应
            if (response.status === 204) {
                return {} as T;
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // 获取文章列表
    async getPosts(params: QueryParams = {}): Promise<PostsResponse> {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });

        const queryString = searchParams.toString();
        const endpoint = queryString ? `/posts?${queryString}` : '/posts';

        return this.request<PostsResponse>(endpoint);
    }

    // 获取单篇文章
    async getPost(id: number): Promise<Post> {
        return this.request<Post>(`/posts/${id}`);
    }

    // 创建文章
    async createPost(data: CreatePostRequest): Promise<Post> {
        return this.request<Post>('/posts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // 更新文章
    async updatePost(id: number, data: UpdatePostRequest): Promise<Post> {
        return this.request<Post>(`/posts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // 删除文章
    async deletePost(id: number): Promise<void> {
        return this.request<void>(`/posts/${id}`, {
            method: 'DELETE',
        });
    }

    // 获取分类列表
    async getCategories(): Promise<string[]> {
        return this.request<string[]>('/posts/categories');
    }

    // 获取作者列表
    async getAuthors(): Promise<string[]> {
        return this.request<string[]>('/posts/authors');
    }
}

export const apiService = new ApiService();
