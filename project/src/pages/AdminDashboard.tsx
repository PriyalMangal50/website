import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { SearchBar } from '../components/SearchBar';
import { BlogList } from '../components/BlogList';
import { Pagination } from '../components/Pagination';
import { blogAPI, adminAPI, mediaAPI } from '../api';
import { Blog, BlogsResponse, User, BlogRequest } from '../types';
import { Plus, Users, X, Upload } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blogs' | 'users'>('blogs');
  
  // Blog state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // User state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Modal state
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogForm, setBlogForm] = useState<BlogRequest>({
  title: '',
  description: '',
  media: '',
  mediaType: undefined
  });
  const [uploading, setUploading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBlogs = async (searchQuery = '', page = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const response: BlogsResponse = await blogAPI.getBlogs(searchQuery, page, 10);
      setBlogs(response.blogs);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (err: any) {
      setError('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setError('');
    
    try {
      const response = await adminAPI.getUsers();
      setUsers(response);
    } catch (err: any) {
      setError('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'blogs') {
      fetchBlogs();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBlogs(search, 1);
  };

  const handlePageChange = (page: number) => {
    fetchBlogs(search, page);
  };

  const handleLike = async (blogId: string) => {
    try {
      await blogAPI.likeBlog(blogId);
      fetchBlogs(search, currentPage);
    } catch (err: any) {
      console.error('Failed to like blog:', err);
    }
  };

  const handleComment = async (blogId: string, comment: string) => {
    try {
      await blogAPI.addComment(blogId, { content: comment });
      fetchBlogs(search, currentPage);
    } catch (err: any) {
      console.error('Failed to add comment:', err);
    }
  };

  const openBlogModal = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogForm({
        title: blog.title,
        description: blog.description,
        media: blog.media || '',
        mediaType: blog.mediaType
      });
    } else {
      setEditingBlog(null);
      setBlogForm({ title: '', description: '', media: '', mediaType: undefined });
    }
    setShowBlogModal(true);
  };

  const closeBlogModal = () => {
    setShowBlogModal(false);
    setEditingBlog(null);
    setBlogForm({ title: '', description: '', media: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await mediaAPI.uploadMedia(file);
      // Determine media type from file
      let mediaType: 'image' | 'gif' | 'video' | undefined;
      if (file.type.startsWith('image/')) {
        mediaType = file.type === 'image/gif' ? 'gif' : 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      }
      setBlogForm(prev => ({ ...prev, media: response.url, mediaType }));
    } catch (err: any) {
      setError('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingBlog) {
        await blogAPI.updateBlog(editingBlog._id, blogForm);
        setSuccess('Blog updated successfully');
      } else {
        await blogAPI.createBlog(blogForm);
        setSuccess('Blog created successfully');
      }
      closeBlogModal();
      fetchBlogs(search, currentPage);
    } catch (err: any) {
      setError(editingBlog ? 'Failed to update blog' : 'Failed to create blog');
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      await blogAPI.deleteBlog(blogId);
      setSuccess('Blog deleted successfully');
      fetchBlogs(search, currentPage);
    } catch (err: any) {
      setError('Failed to delete blog');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await adminAPI.deleteUser(userId);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      setError('Failed to delete user');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (err: any) {
      setError('Failed to update user role');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('blogs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'blogs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Blog Management
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {activeTab === 'blogs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <SearchBar 
                value={search}
                onChange={setSearch}
                onSearch={handleSearch}
              />
              <button
                onClick={() => openBlogModal()}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>New Blog</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading blogs...</p>
              </div>
            ) : (
              <>
                <BlogList 
                  blogs={blogs}
                  onLike={handleLike}
                  onComment={handleComment}
                  onEdit={openBlogModal}
                  onDelete={handleDeleteBlog}
                />
                
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            </div>

            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user._id, e.target.value as 'admin' | 'user')}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Blog Modal */}
        {showBlogModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingBlog ? 'Edit Blog' : 'Create New Blog'}
                </h3>
                <button
                  onClick={closeBlogModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleBlogSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={blogForm.description}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Media</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="media-upload"
                    />
                    <label
                      htmlFor="media-upload"
                      className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <Upload size={16} />
                      <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                    </label>
                    {blogForm.media && (
                      <span className="text-sm text-green-600">Media uploaded ({blogForm.mediaType})</span>
                    )}
                  </div>
                  {/* Option for URL input */}
                  <div className="mt-2">
                    <label className="block text-xs text-gray-500 mb-1">Or paste a media URL (image/gif/video/webpage):</label>
                    <input
                      type="text"
                      value={blogForm.media || ''}
                      onChange={e => {
                        const url = e.target.value;
                        let mediaType: 'image' | 'gif' | 'video' | 'url' | undefined = 'url';
                        if (url.match(/\.(jpg|jpeg|png)$/i)) mediaType = 'image';
                        else if (url.match(/\.gif$/i)) mediaType = 'gif';
                        else if (url.match(/\.(mp4|webm|ogg)$/i)) mediaType = 'video';
                        setBlogForm(prev => ({ ...prev, media: url, mediaType }));
                      }}
                      placeholder="https://..."
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {blogForm.media && (
                    <div className="mt-2">
                      {blogForm.mediaType === 'video' ? (
                        <video controls className="w-full h-32 object-cover rounded">
                          <source src={blogForm.media} type="video/mp4" />
                        </video>
                      ) : blogForm.mediaType === 'image' || blogForm.mediaType === 'gif' ? (
                        <img 
                          src={blogForm.media} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : blogForm.mediaType === 'url' ? (
                        <a href={blogForm.media} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Link</a>
                      ) : null}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeBlogModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingBlog ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};