import { useState, useEffect } from 'react';
import { apiService, Post, QueryParams } from '@/lib/api';

export const usePosts = (initialParams: QueryParams = {}) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
    });

    const fetchPosts = async (params: QueryParams = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiService.getPosts({
                ...initialParams,
                ...params,
            });

            setPosts(response.posts);
            setPagination({
                page: response.page,
                limit: response.limit,
                total: response.total,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载失败');
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (id: number) => {
        try {
            await apiService.deletePost(id);
            setPosts(prev => prev.filter(post => post.id !== id));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : '删除失败');
            return false;
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return {
        posts,
        loading,
        error,
        pagination,
        fetchPosts,
        deletePost,
        setError,
    };
};
