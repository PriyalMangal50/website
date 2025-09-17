const express = require('express');
const jwt = require('jsonwebtoken');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const verifyAdmin = require('../middleware/verifyAdmin'); // Import the middleware

const router = express.Router();

// --- ADMIN-ONLY ROUTES ---

// CREATE a new blog
router.post('/', verifyAdmin, async (req, res) => {
  try {
    let { title, description, media, mediaType } = req.body;
    // If media is a local path, convert to absolute URL
    if (media && media.startsWith('/uploads/')) {
      media = `${req.protocol}://${req.get('host')}${media}`;
    }
    const blog = await Blog.create({ title, description, media, mediaType, author: req.user.id });
    res.status(201).json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE a blog
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    let { title, description, media, mediaType } = req.body;
    if (media && media.startsWith('/uploads/')) {
      media = `${req.protocol}://${req.get('host')}${media}`;
    }
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, description, media, mediaType },
      { new: true }
    );
    if (!updatedBlog) return res.status(404).json({ message: 'Blog not found' });
    res.json(updatedBlog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a blog
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// --- PUBLIC & USER ROUTES ---

// GET all blogs
router.get('/', async (req, res) => {
  // ... your existing get logic ...
  const { page = 1, limit = 10, search = '' } = req.query;
  const query = search ? { $or: [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }] } : {};
  try {
      const blogs = await Blog.find(query).populate('author', 'username').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
      const totalBlogs = await Blog.countDocuments(query);
      // Ensure media and mediaType fields are always present
      const blogsWithMedia = blogs.map(blog => {
        let media = blog.media || '';
        // Patch: If media is a local path, convert to absolute URL
        if (media.startsWith('/uploads/')) {
          media = `${req.protocol}://${req.get('host')}${media}`;
        }
        return {
          ...blog.toObject(),
          media,
          mediaType: blog.mediaType || '',
        };
      });
    res.json({ blogs: blogsWithMedia, totalPages: Math.ceil(totalBlogs / limit), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
});

// LIKE a blog
router.post('/:id/like', async (req, res) => {
  // Like a blog (user must be authenticated)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }
  const token = authHeader.split(' ')[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (blog.likes.includes(userId)) {
      // Unlike if already liked
      blog.likes.pull(userId);
    } else {
      blog.likes.push(userId);
    }
    await blog.save();
    res.json({ likes: blog.likes.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// COMMENT on a blog
router.post('/:id/comment', async (req, res) => {
  // Comment on a blog (user must be authenticated)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }
  const token = authHeader.split(' ')[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    const { content } = req.body;
    const comment = await Comment.create({ content, author: userId, blog: blog._id });
    blog.comments.push(comment._id);
    await blog.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a comment (user can delete their own comment)
router.delete('/:blogId/comment/:commentId', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }
  const token = authHeader.split(' ')[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own comment.' });
    }
    await Comment.findByIdAndDelete(req.params.commentId);
    // Remove comment from blog.comments array
    await Blog.findByIdAndUpdate(req.params.blogId, { $pull: { comments: req.params.commentId } });
    res.json({ message: 'Comment deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;