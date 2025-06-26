"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, User, Eye, Edit3, Trash2, Loader2 } from 'lucide-react';
import { apiService, Post, CreatePostRequest, QueryParams } from '@/lib/api';

const BlogSystem = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'view' | 'edit'>('list');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const [formData, setFormData] = useState<CreatePostRequest>({
    title: '',
    content: '',
    author: '',
    tags: '',
    category: ''
  });

  // 加载文章列表
  const loadPosts = async (params: QueryParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        ...params,
      };

      const response = await apiService.getPosts(queryParams);
      setPosts(response.posts);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        page: response.page,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  };

  // 初始化数据
  useEffect(() => {
    loadPosts();
    loadCategories();
  }, []);

  // 搜索和分类过滤

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      loadPosts({ page: 1 });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  // 处理表单提交
  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      setError('标题和内容不能为空');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (currentView === 'edit' && selectedPost) {
        await apiService.updatePost(selectedPost.id, formData);
      } else {
        await apiService.createPost(formData);
      }

      setFormData({ title: '', content: '', author: '', tags: '', category: '' });
      setCurrentView('list');
      loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除文章
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    setLoading(true);
    setError(null);

    try {
      await apiService.deletePost(id);
      if (selectedPost && selectedPost.id === id) {
        setCurrentView('list');
        setSelectedPost(null);
      }
      loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看文章
  const handleView = async (post: Post) => {
    setLoading(true);
    setError(null);

    try {
      const updatedPost = await apiService.getPost(post.id);
      setSelectedPost(updatedPost);
      setCurrentView('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  // 编辑文章
  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      author: post.author,
      category: post.category,
      tags: post.tags,
    });
    setCurrentView('edit');
  };

  // 分页处理
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadPosts({ page: newPage });
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 渲染错误信息
  const renderError = () => (
      error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button
                onClick={() => setError(null)}
                className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
      )
  );

  // 渲染加载状态
  const renderLoading = () => (
      loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2">加载中...</span>
          </div>
      )
  );

  // 渲染分页
  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>

          <span className="px-4 py-2 text-sm text-gray-700">
          第 {pagination.page} 页，共 {totalPages} 页
        </span>

          <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
    );
  };

  // 渲染文章列表
  const renderPostList = () => (
      <div className="space-y-6">
        {renderError()}

        {/* 搜索和过滤 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有分类</option>
              {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
              ))}
            </select>
          </div>

          <button
              onClick={() => setCurrentView('create')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建文章
          </button>
        </div>

        {renderLoading()}

        {/* 文章列表 */}
        {!loading && (
            <div className="grid gap-6">
              {posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h2
                            className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2"
                            onClick={() => handleView(post)}
                        >
                          {post.title}
                        </h2>
                        <div className="flex gap-2">
                          <button
                              onClick={() => handleView(post)}
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                              title="查看"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                              onClick={() => handleEdit(post)}
                              className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                              title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                              onClick={() => handleDelete(post.id)}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                              title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.content}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.split(',').map((tag, index) => (
                            <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
                      {tag.trim()}
                    </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </span>
                          <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                            {formatDate(post.createdAt)}
                    </span>
                          {post.category && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {post.category}
                      </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.views}
                        </div>
                      </div>
                    </div>
                  </article>
              ))}
            </div>
        )}

        {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">没有找到相关文章</p>
            </div>
        )}

        {renderPagination()}
      </div>
  );

  // 渲染创建/编辑表单
  const renderForm = () => (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          {renderError()}

          <div className="flex items-center gap-2 mb-6">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {currentView === 'edit' ? '编辑文章' : '新建文章'}
            </h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  文章标题 *
                </label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入文章标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作者
                </label>
                <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入作者姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">选择分类</option>
                  <option value="技术">技术</option>
                  <option value="设计">设计</option>
                  <option value="产品">产品</option>
                  <option value="生活">生活</option>
                  <option value="云计算">云计算</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="用逗号分隔标签，如：React, Next.js, 前端"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文章内容 *
              </label>
              <textarea
                  required
                  rows={12}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入文章内容..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {currentView === 'edit' ? '更新文章' : '发布文章'}
              </button>
              <button
                  onClick={() => {
                    setCurrentView('list');
                    setFormData({ title: '', content: '', author: '', tags: '', category: '' });
                    setSelectedPost(null);
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
  );

  // 渲染文章详情
  const renderPostView = () => (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6">
            {renderError()}

            <button
                onClick={() => setCurrentView('list')}
                className="mb-6 text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← 返回列表
            </button>

            {selectedPost && (
                <article>
                  <header className="mb-8">
                    <div className="flex justify-between items-start mb-4">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {selectedPost.title}
                      </h1>
                      <button
                          onClick={() => handleEdit(selectedPost)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        编辑
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedPost.author}
                  </span>
                      <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                        {formatDate(selectedPost.createdAt)}
                  </span>
                      <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                        {selectedPost.views} 次浏览
                  </span>
                      {selectedPost.category && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {selectedPost.category}
                    </span>
                      )}
                    </div>

                    {selectedPost.tags && (
                        <div className="flex flex-wrap gap-2">
                          {selectedPost.tags.split(',').map((tag, index) => (
                              <span key={index} className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {tag.trim()}
                      </span>
                          ))}
                        </div>
                    )}
                  </header>

                  <div className="prose max-w-none">
                    <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedPost.content}
                    </div>
                  </div>
                </article>
            )}
          </div>
        </div>
      </div>
  );

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold text-gray-900">我的博客</h1>
              <nav className="flex space-x-4">
                <button
                    onClick={() => setCurrentView('list')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'list'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  文章列表
                </button>
                <button
                    onClick={() => setCurrentView('create')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'create'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  新建文章
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'list' && renderPostList()}
          {(currentView === 'create' || currentView === 'edit') && renderForm()}
          {currentView === 'view' && selectedPost && renderPostView()}
        </main>
      </div>
  );
};

export default BlogSystem;
