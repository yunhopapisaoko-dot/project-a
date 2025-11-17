import { Hono } from "npm:hono@4.6.14";
import { cors } from "npm:hono@4.6.14/cors";
import { logger } from "npm:hono@4.6.14/logger";
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Initialize storage buckets
const initStorage = async () => {
  const avatarBucketName = 'make-531a6b8c-avatars';
  const postsBucketName = 'make-531a6b8c-posts';
  
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  
  if (!buckets?.some(b => b.name === avatarBucketName)) {
    await supabaseAdmin.storage.createBucket(avatarBucketName, { public: false });
    console.log(`Created bucket: ${avatarBucketName}`);
  }
  
  if (!buckets?.some(b => b.name === postsBucketName)) {
    await supabaseAdmin.storage.createBucket(postsBucketName, { public: false });
    console.log(`Created bucket: ${postsBucketName}`);
  }
};

initStorage().catch(console.error);

// Health check
app.get("/make-server-531a6b8c/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up
app.post("/make-server-531a6b8c/signup", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (error) {
      return c.json({ error: error.message }, 400);
    }
    
    // Save password in user metadata for recovery
    await kv.set(`user:${data.user.id}:password`, password);
    
    return c.json({ userId: data.user.id, email: data.user.email });
  } catch (error) {
    console.error('Error in signup:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Set username
app.post("/make-server-531a6b8c/set-username", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { username } = await c.req.json();
    
    if (!username || username.length < 3) {
      return c.json({ error: 'Username must be at least 3 characters' }, 400);
    }
    
    const existingUsers = await kv.getByPrefix('user:');
    const usernameTaken = existingUsers.some((u: any) => u.username === username && u.userId !== user.id);
    
    if (usernameTaken) {
      return c.json({ error: 'Username already taken' }, 400);
    }
    
    await kv.set(`user:${user.id}`, {
      userId: user.id,
      email: user.email,
      username,
      avatarUrl: null,
      bio: '',
      createdAt: new Date().toISOString()
    });
    
    return c.json({ success: true, username });
  } catch (error) {
    console.error('Error setting username:', error);
    return c.json({ error: 'Internal server error while setting username' }, 500);
  }
});

// Update username
app.post("/make-server-531a6b8c/update-username", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { username } = await c.req.json();
    
    if (!username || username.length < 3) {
      return c.json({ error: 'Username must be at least 3 characters' }, 400);
    }
    
    const existingUsers = await kv.getByPrefix('user:');
    const usernameTaken = existingUsers.some((u: any) => u.username === username && u.userId !== user.id);
    
    if (usernameTaken) {
      return c.json({ error: 'Username already taken' }, 400);
    }
    
    const profile = await kv.get(`user:${user.id}`);
    await kv.set(`user:${user.id}`, {
      ...profile,
      username
    });

    const allPosts = await kv.getByPrefix('post:');
    for (const post of allPosts) {
      if (post.userId === user.id) {
        await kv.set(post.postId, {
          ...post,
          username
        });
      }
    }

    const allMessages = await kv.getByPrefix('message:');
    for (const message of allMessages) {
      if (message.userId === user.id) {
        await kv.set(message.messageId, {
          ...message,
          username
        });
      }
    }
    
    return c.json({ success: true, username });
  } catch (error) {
    console.error('Error updating username:', error);
    return c.json({ error: 'Internal server error while updating username' }, 500);
  }
});

// Update bio
app.post("/make-server-531a6b8c/update-bio", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { bio } = await c.req.json();
    
    const profile = await kv.get(`user:${user.id}`);
    await kv.set(`user:${user.id}`, {
      ...profile,
      bio: bio || ''
    });
    
    return c.json({ success: true, bio });
  } catch (error) {
    console.error('Error updating bio:', error);
    return c.json({ error: 'Internal server error while updating bio' }, 500);
  }
});

// Get profile
app.get("/make-server-531a6b8c/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const profile = await kv.get(`user:${user.id}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    return c.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    return c.json({ error: 'Internal server error while getting profile' }, 500);
  }
});

// Upload avatar
app.post("/make-server-531a6b8c/upload-avatar", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('make-531a6b8c-avatars')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return c.json({ error: 'Failed to upload avatar' }, 500);
    }
    
    const { data: urlData } = await supabaseAdmin.storage
      .from('make-531a6b8c-avatars')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);
    
    const profile = await kv.get(`user:${user.id}`);
    await kv.set(`user:${user.id}`, {
      ...profile,
      avatarUrl: urlData?.signedUrl || null,
      avatarPath: fileName
    });
    
    return c.json({ avatarUrl: urlData?.signedUrl });
  } catch (error) {
    console.error('Error in upload-avatar:', error);
    return c.json({ error: 'Internal server error during avatar upload' }, 500);
  }
});

// Create post
app.post("/make-server-531a6b8c/create-post", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const formData = await c.req.formData();
    const title = formData.get('title') as string;
    const text = formData.get('text') as string;
    const file = formData.get('file') as File | null;
    const isFeatured = formData.get('isFeatured') === 'true';
    
    let imageUrl = null;
    
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const fileBuffer = await file.arrayBuffer();
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('make-531a6b8c-posts')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading post image:', uploadError);
        return c.json({ error: 'Failed to upload image' }, 500);
      }
      
      const { data: urlData } = await supabaseAdmin.storage
        .from('make-531a6b8c-posts')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);
      
      imageUrl = urlData?.signedUrl;
    }
    
    const postId = `post:${Date.now()}-${user.id}`;
    const userProfile = await kv.get(`user:${user.id}`);
    
    const post = {
      postId,
      userId: user.id,
      username: userProfile.username,
      avatarUrl: userProfile.avatarUrl,
      title: title || '',
      text: text || '',
      imageUrl,
      isFeatured,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };
    
    await kv.set(postId, post);
    
    return c.json({ success: true, post });
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Internal server error while creating post' }, 500);
  }
});

// Get posts
app.get("/make-server-531a6b8c/posts", async (c) => {
  try {
    const type = c.req.query('type');
    const userId = c.req.query('userId');
    
    let allPosts = await kv.getByPrefix('post:');
    
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    for (const post of allPosts) {
      if (post.isFeatured && post.featuredAt) {
        const featuredTime = new Date(post.featuredAt).getTime();
        if (featuredTime < threeDaysAgo) {
          post.isFeatured = false;
          delete post.featuredAt;
          await kv.set(post.postId, post);
        }
      }
    }
    
    allPosts = await kv.getByPrefix('post:');
    let posts = allPosts;
    
    if (userId) {
      posts = allPosts.filter((p: any) => p.userId === userId);
    }
    
    if (type === 'featured') {
      posts = posts.filter((p: any) => p.isFeatured);
    }
    
    posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({ posts });
  } catch (error) {
    console.error('Error getting posts:', error);
    return c.json({ error: 'Internal server error while getting posts' }, 500);
  }
});

// Get my posts
app.get("/make-server-531a6b8c/my-posts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const allPosts = await kv.getByPrefix('post:');
    const myPosts = allPosts.filter((p: any) => p.userId === user.id);
    
    myPosts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({ posts: myPosts });
  } catch (error) {
    console.error('Error getting my posts:', error);
    return c.json({ error: 'Internal server error while getting my posts' }, 500);
  }
});

// Get user by id
app.get("/make-server-531a6b8c/user/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const profile = await kv.get(`user:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(profile);
  } catch (error) {
    console.error('Error getting user:', error);
    return c.json({ error: 'Internal server error while getting user' }, 500);
  }
});

// Toggle feature
app.post("/make-server-531a6b8c/toggle-feature", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { postId } = await c.req.json();
    const post = await kv.get(postId);
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    if (post.userId !== user.id) {
      return c.json({ error: 'Only post owner can feature their post' }, 403);
    }
    
    if (!post.isFeatured) {
      const allPosts = await kv.getByPrefix('post:');
      for (const p of allPosts) {
        if (p.isFeatured && p.postId !== postId) {
          p.isFeatured = false;
          delete p.featuredAt;
          await kv.set(p.postId, p);
        }
      }
      
      post.isFeatured = true;
      post.featuredAt = new Date().toISOString();
    } else {
      post.isFeatured = false;
      delete post.featuredAt;
    }
    
    await kv.set(postId, post);
    
    return c.json({ success: true, isFeatured: post.isFeatured });
  } catch (error) {
    console.error('Error toggling feature:', error);
    return c.json({ error: 'Internal server error while toggling feature' }, 500);
  }
});

// Like post
app.post("/make-server-531a6b8c/like-post", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { postId } = await c.req.json();
    const post = await kv.get(postId);
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const likes = post.likes || [];
    const hasLiked = likes.includes(user.id);
    
    if (hasLiked) {
      post.likes = likes.filter((id: string) => id !== user.id);
    } else {
      post.likes = [...likes, user.id];
      
      if (post.userId !== user.id) {
        const userProfile = await kv.get(`user:${user.id}`);
        const notificationId = `notification:${post.userId}:${Date.now()}-${user.id}`;
        await kv.set(notificationId, {
          notificationId,
          userId: post.userId,
          type: 'like',
          fromUserId: user.id,
          fromUsername: userProfile.username,
          fromAvatarUrl: userProfile.avatarUrl,
          postId,
          message: 'curtiu sua postagem',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    await kv.set(postId, post);
    
    return c.json({ success: true, likesCount: post.likes.length, hasLiked: !hasLiked });
  } catch (error) {
    console.error('Error liking post:', error);
    return c.json({ error: 'Internal server error while liking post' }, 500);
  }
});

// Add comment
app.post("/make-server-531a6b8c/add-comment", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { postId, text, parentCommentId } = await c.req.json();
    const post = await kv.get(postId);
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const userProfile = await kv.get(`user:${user.id}`);
    const commentId = `comment:${Date.now()}-${user.id}`;
    
    const comment = {
      commentId,
      userId: user.id,
      username: userProfile.username,
      avatarUrl: userProfile.avatarUrl,
      text,
      parentCommentId: parentCommentId || null,
      replies: [],
      createdAt: new Date().toISOString()
    };
    
    const addReplyToComment = (comments: any[], targetId: string): boolean => {
      for (const c of comments) {
        if (c.commentId === targetId) {
          c.replies = [...(c.replies || []), comment];
          return true;
        }
        if (c.replies && c.replies.length > 0) {
          if (addReplyToComment(c.replies, targetId)) {
            return true;
          }
        }
      }
      return false;
    };
    
    if (parentCommentId) {
      const found = addReplyToComment(post.comments, parentCommentId);
      if (!found) {
        return c.json({ error: 'Parent comment not found' }, 404);
      }
    } else {
      post.comments = [...(post.comments || []), comment];
    }
    
    await kv.set(postId, post);
    
    if (post.userId !== user.id) {
      const userProfile = await kv.get(`user:${user.id}`);
      const notificationId = `notification:${post.userId}:${Date.now()}-${user.id}`;
      await kv.set(notificationId, {
        notificationId,
        userId: post.userId,
        type: 'comment',
        fromUserId: user.id,
        fromUsername: userProfile.username,
        fromAvatarUrl: userProfile.avatarUrl,
        postId,
        message: 'comentou na sua postagem',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
    
    return c.json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return c.json({ error: 'Internal server error while adding comment' }, 500);
  }
});

// Send message
app.post("/make-server-531a6b8c/send-message", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { chatId, text, replyTo, replyToText, replyToUsername } = await c.req.json();
    const userProfile = await kv.get(`user:${user.id}`);
    
    const messageId = `message:${chatId}:${Date.now()}-${user.id}`;
    const message = {
      messageId,
      chatId,
      userId: user.id,
      username: userProfile.username,
      avatarUrl: userProfile.avatarUrl,
      text,
      replyTo,
      replyToText,
      replyToUsername,
      viewedBy: [user.id],
      createdAt: new Date().toISOString()
    };
    
    await kv.set(messageId, message);
    
    return c.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ error: 'Internal server error while sending message' }, 500);
  }
});

// Get messages
app.get("/make-server-531a6b8c/messages/:chatId", async (c) => {
  try {
    const chatId = c.req.param('chatId');
    const allMessages = await kv.getByPrefix(`message:${chatId}:`);
    
    allMessages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return c.json({ messages: allMessages });
  } catch (error) {
    console.error('Error getting messages:', error);
    return c.json({ error: 'Internal server error while getting messages' }, 500);
  }
});

// Follow user
app.post("/make-server-531a6b8c/follow-user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { targetUserId } = await c.req.json();
    
    if (user.id === targetUserId) {
      return c.json({ error: 'Cannot follow yourself' }, 400);
    }
    
    const followId = `follow:${user.id}:${targetUserId}`;
    const existingFollow = await kv.get(followId);
    
    if (existingFollow) {
      await kv.del(followId);
      return c.json({ success: true, isFollowing: false });
    } else {
      await kv.set(followId, {
        followId,
        followerId: user.id,
        followingId: targetUserId,
        createdAt: new Date().toISOString()
      });
      
      const userProfile = await kv.get(`user:${user.id}`);
      const notificationId = `notification:${targetUserId}:${Date.now()}-${user.id}`;
      await kv.set(notificationId, {
        notificationId,
        userId: targetUserId,
        type: 'follow',
        fromUserId: user.id,
        fromUsername: userProfile.username,
        fromAvatarUrl: userProfile.avatarUrl,
        message: 'começou a seguir você',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      
      return c.json({ success: true, isFollowing: true });
    }
  } catch (error) {
    console.error('Error following user:', error);
    return c.json({ error: 'Internal server error while following user' }, 500);
  }
});

// Get follow stats
app.get("/make-server-531a6b8c/user/:userId/follow-stats", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const allFollows = await kv.getByPrefix('follow:');
    const followers = allFollows.filter((f: any) => f.followingId === userId);
    const following = allFollows.filter((f: any) => f.followerId === userId);
    
    return c.json({
      followersCount: followers.length,
      followingCount: following.length,
      followers,
      following
    });
  } catch (error) {
    console.error('Error getting follow stats:', error);
    return c.json({ error: 'Internal server error while getting follow stats' }, 500);
  }
});

// Check if following
app.get("/make-server-531a6b8c/is-following/:targetUserId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const targetUserId = c.req.param('targetUserId');
    const followId = `follow:${user.id}:${targetUserId}`;
    const follow = await kv.get(followId);
    
    return c.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return c.json({ error: 'Internal server error while checking follow status' }, 500);
  }
});

// Get notifications
app.get("/make-server-531a6b8c/notifications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const allNotifications = await kv.getByPrefix(`notification:${user.id}:`);
    
    allNotifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({ notifications: allNotifications });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return c.json({ error: 'Internal server error while getting notifications' }, 500);
  }
});

// Mark notification as read
app.post("/make-server-531a6b8c/mark-notification-read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { notificationId } = await c.req.json();
    const notification = await kv.get(notificationId);
    
    if (!notification || notification.userId !== user.id) {
      return c.json({ error: 'Notification not found' }, 404);
    }
    
    notification.isRead = true;
    await kv.set(notificationId, notification);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: 'Internal server error while marking notification as read' }, 500);
  }
});

// Mark all notifications as read
app.post("/make-server-531a6b8c/mark-all-notifications-read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const allNotifications = await kv.getByPrefix(`notification:${user.id}:`);
    
    for (const notification of allNotifications) {
      if (!notification.isRead) {
        notification.isRead = true;
        await kv.set(notification.notificationId, notification);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return c.json({ error: 'Internal server error while marking all notifications as read' }, 500);
  }
});

// View message
app.post("/make-server-531a6b8c/view-message", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { messageId } = await c.req.json();
    const message = await kv.get(messageId);
    
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }
    
    if (!message.viewedBy.includes(user.id)) {
      message.viewedBy.push(user.id);
      await kv.set(messageId, message);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error viewing message:', error);
    return c.json({ error: 'Internal server error while viewing message' }, 500);
  }
});

// Get all users (admin)
app.get("/make-server-531a6b8c/admin/users", async (c) => {
  try {
    const allUsers = await kv.getByPrefix('user:');
    
    // Filter out password entries - only get actual user profiles
    const userProfiles = allUsers.filter((item: any) => 
      item.userId && item.username && !item.messageId && !item.postId
    );
    
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    const users = await Promise.all(userProfiles.map(async (user: any) => {
      const authUser = authUsers?.users.find((u: any) => u.id === user.userId);
      
      // Get the password stored for this user
      const password = await kv.get(`user:${user.userId}:password`);
      
      return {
        ...user,
        email: authUser?.email || user.email,
        password: password || 'não disponível'
      };
    }));
    
    return c.json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    return c.json({ error: 'Internal server error while getting users' }, 500);
  }
});

// Update user role (admin)
app.post("/make-server-531a6b8c/admin/update-role", async (c) => {
  try {
    const { userId, role } = await c.req.json();
    
    const userProfile = await kv.get(`user:${userId}`);
    
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    userProfile.role = role;
    await kv.set(`user:${userId}`, userProfile);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating role:', error);
    return c.json({ error: 'Internal server error while updating role' }, 500);
  }
});

// Create public chat (admin)
app.post("/make-server-531a6b8c/admin/create-chat", async (c) => {
  try {
    const { name, description, imageUrl, backgroundUrl } = await c.req.json();
    
    const chatId = `chat:${Date.now()}`;
    const chat = {
      chatId,
      name,
      description,
      imageUrl,
      backgroundUrl,
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(chatId, chat);
    
    return c.json({ success: true, chat });
  } catch (error) {
    console.error('Error creating chat:', error);
    return c.json({ error: 'Internal server error while creating chat' }, 500);
  }
});

// Get all chats (admin)
app.get("/make-server-531a6b8c/admin/chats", async (c) => {
  try {
    const allChats = await kv.getByPrefix('chat:');
    
    allChats.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({ chats: allChats });
  } catch (error) {
    console.error('Error getting chats:', error);
    return c.json({ error: 'Internal server error while getting chats' }, 500);
  }
});

// Delete chat (admin)
app.post("/make-server-531a6b8c/admin/delete-chat", async (c) => {
  try {
    const { chatId } = await c.req.json();
    
    await kv.del(chatId);
    
    const allMessages = await kv.getByPrefix(`message:${chatId}:`);
    for (const message of allMessages) {
      await kv.del(message.messageId);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return c.json({ error: 'Internal server error while deleting chat' }, 500);
  }
});

// ADMIN: Clear all data (reset database)
app.post("/make-server-531a6b8c/admin/clear-all-data", async (c) => {
  try {
    console.log('🗑️ Starting database clear operation...');
    
    // Delete all users from Supabase Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    console.log(`👥 Found ${authUsers?.users.length || 0} auth users to delete`);
    
    if (authUsers?.users) {
      for (const user of authUsers.users) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log(`✅ Deleted auth user: ${user.email}`);
      }
    }
    
    // Delete all KV store data
    const allKeys = [
      'user:',
      'post:',
      'chat:',
      'message:',
      'notification:',
      'follow:',
      'invite:'
    ];
    
    let totalDeleted = 0;
    
    for (const prefix of allKeys) {
      const items = await kv.getByPrefix(prefix);
      console.log(`📦 Found ${items.length} items with prefix: ${prefix}`);
      
      for (const item of items) {
        const key = item.userId || item.postId || item.chatId || item.messageId || 
                    item.notificationId || item.followId || item.inviteId;
        if (key) {
          await kv.del(key);
          totalDeleted++;
        }
      }
    }
    
    console.log(`✅ Cleared ${totalDeleted} items from KV store`);
    console.log('🎉 Database reset complete!');
    
    return c.json({ 
      success: true, 
      message: 'All data cleared successfully',
      authUsersDeleted: authUsers?.users.length || 0,
      kvItemsDeleted: totalDeleted
    });
  } catch (error) {
    console.error('💥 Error clearing data:', error);
    return c.json({ error: 'Internal server error while clearing data' }, 500);
  }
});

// Create chat (users)
app.post("/make-server-531a6b8c/chats/create", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, description, imageUrl, backgroundUrl, isPublic } = await c.req.json();
    
    if (!name || !description) {
      return c.json({ error: 'Name and description are required' }, 400);
    }
    
    const chatId = `chat:${Date.now()}-${user.id}`;
    const chat = {
      chatId,
      name,
      description,
      imageUrl: imageUrl || '',
      backgroundUrl: backgroundUrl || '',
      createdBy: user.id,
      isPublic: isPublic || false,
      members: [user.id],
      createdAt: new Date().toISOString()
    };
    
    await kv.set(chatId, chat);
    
    const profile = await kv.get(`user:${user.id}`);
    const systemMessageId = `message:${chatId}:${Date.now()}-system`;
    const systemMessage = {
      messageId: systemMessageId,
      chatId,
      userId: 'system',
      username: 'Sistema',
      text: `${profile?.username || 'Usuário'} criou este chat`,
      avatarUrl: null,
      viewedBy: [],
      isSystemMessage: true,
      createdAt: new Date().toISOString()
    };
    await kv.set(systemMessageId, systemMessage);
    
    return c.json({ success: true, chat });
  } catch (error) {
    console.error('Error creating chat:', error);
    return c.json({ error: 'Internal server error while creating chat' }, 500);
  }
});

// List chats (users)
app.get("/make-server-531a6b8c/chats/list", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allChats = await kv.getByPrefix('chat:');
    
    const visibleChats = allChats.filter((chat: any) => {
      return chat.isPublic || chat.members?.includes(user.id);
    });
    
    visibleChats.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return c.json({ chats: visibleChats });
  } catch (error) {
    console.error('Error getting chats:', error);
    return c.json({ error: 'Internal server error while getting chats' }, 500);
  }
});

// Join chat
app.post("/make-server-531a6b8c/chats/join", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { chatId } = await c.req.json();
    const chat = await kv.get(chatId);
    
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    if (!chat.members) {
      chat.members = [];
    }
    
    if (!chat.members.includes(user.id)) {
      chat.members.push(user.id);
      await kv.set(chatId, chat);
      
      const profile = await kv.get(`user:${user.id}`);
      const systemMessageId = `message:${chatId}:${Date.now()}-join`;
      const systemMessage = {
        messageId: systemMessageId,
        chatId,
        userId: 'system',
        username: 'Sistema',
        text: `${profile?.username || 'Usuário'} entrou no chat`,
        avatarUrl: null,
        viewedBy: [],
        isSystemMessage: true,
        createdAt: new Date().toISOString()
      };
      await kv.set(systemMessageId, systemMessage);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error joining chat:', error);
    return c.json({ error: 'Internal server error while joining chat' }, 500);
  }
});

// Leave chat
app.post("/make-server-531a6b8c/chats/leave", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { chatId } = await c.req.json();
    const chat = await kv.get(chatId);
    
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    if (chat.members) {
      chat.members = chat.members.filter((memberId: string) => memberId !== user.id);
      await kv.set(chatId, chat);
      
      const profile = await kv.get(`user:${user.id}`);
      const systemMessageId = `message:${chatId}:${Date.now()}-leave`;
      const systemMessage = {
        messageId: systemMessageId,
        chatId,
        userId: 'system',
        username: 'Sistema',
        text: `${profile?.username || 'Usuário'} saiu do chat`,
        avatarUrl: null,
        viewedBy: [],
        isSystemMessage: true,
        createdAt: new Date().toISOString()
      };
      await kv.set(systemMessageId, systemMessage);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error leaving chat:', error);
    return c.json({ error: 'Internal server error while leaving chat' }, 500);
  }
});

// Send chat invite
app.post("/make-server-531a6b8c/chats/invite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { chatId, targetUserId } = await c.req.json();
    const chat = await kv.get(chatId);
    
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    if (chat.createdBy !== user.id && !chat.members?.includes(user.id)) {
      return c.json({ error: 'You must be a member to invite others' }, 403);
    }

    const inviteId = `invite:${Date.now()}-${targetUserId}`;
    const senderProfile = await kv.get(`user:${user.id}`);
    const invite = {
      inviteId,
      chatId,
      chatName: chat.name,
      fromUserId: user.id,
      fromUsername: senderProfile?.username || 'Usuário',
      toUserId: targetUserId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(inviteId, invite);
    
    const notificationId = `notification:${Date.now()}-${targetUserId}`;
    await kv.set(notificationId, {
      notificationId,
      userId: targetUserId,
      type: 'chat_invite',
      fromUserId: user.id,
      fromUsername: senderProfile?.username || 'Usuário',
      chatId,
      chatName: chat.name,
      inviteId,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error sending invite:', error);
    return c.json({ error: 'Internal server error while sending invite' }, 500);
  }
});

// Accept chat invite
app.post("/make-server-531a6b8c/chats/accept-invite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { inviteId } = await c.req.json();
    const invite = await kv.get(inviteId);
    
    if (!invite || invite.toUserId !== user.id) {
      return c.json({ error: 'Invite not found' }, 404);
    }

    const chat = await kv.get(invite.chatId);
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    if (!chat.members) {
      chat.members = [];
    }
    
    if (!chat.members.includes(user.id)) {
      chat.members.push(user.id);
      await kv.set(invite.chatId, chat);
      
      const profile = await kv.get(`user:${user.id}`);
      const systemMessageId = `message:${invite.chatId}:${Date.now()}-accept`;
      const systemMessage = {
        messageId: systemMessageId,
        chatId: invite.chatId,
        userId: 'system',
        username: 'Sistema',
        text: `${profile?.username || 'Usuário'} entrou no chat`,
        avatarUrl: null,
        viewedBy: [],
        isSystemMessage: true,
        createdAt: new Date().toISOString()
      };
      await kv.set(systemMessageId, systemMessage);
    }

    invite.status = 'accepted';
    await kv.set(inviteId, invite);
    
    return c.json({ success: true, chatId: invite.chatId });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return c.json({ error: 'Internal server error while accepting invite' }, 500);
  }
});

// Reject chat invite
app.post("/make-server-531a6b8c/chats/reject-invite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { inviteId } = await c.req.json();
    const invite = await kv.get(inviteId);
    
    if (!invite || invite.toUserId !== user.id) {
      return c.json({ error: 'Invite not found' }, 404);
    }

    invite.status = 'rejected';
    await kv.set(inviteId, invite);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error rejecting invite:', error);
    return c.json({ error: 'Internal server error while rejecting invite' }, 500);
  }
});

// Hospital endpoints
app.post("/server", async (c) => {
  try {
    const body = await c.req.json();
    const { type } = body;

    if (type === 'getConsultations') {
      const consultations = await kv.getByPrefix('consultation:');
      return c.json({ consultations });
    }

    if (type === 'requestConsultation') {
      const { accessToken, consultationType, cost, healthBoost } = body;
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (!user || authError) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const userProfile = await kv.get(`user:${user.id}`);
      
      // Deduct cost from wallet
      if ((userProfile.wallet || 0) < cost) {
        return c.json({ error: 'Insufficient funds' }, 400);
      }

      userProfile.wallet = (userProfile.wallet || 0) - cost;
      await kv.set(`user:${user.id}`, userProfile);

      const consultationId = `consultation:${Date.now()}-${user.id}`;
      const consultation = {
        consultationId,
        userId: user.id,
        username: userProfile.username,
        consultationType,
        cost,
        healthBoost,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await kv.set(consultationId, consultation);
      return c.json({ success: true, consultation });
    }

    if (type === 'handleConsultation') {
      const { accessToken, consultationId, approved } = body;
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (!user || authError) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const consultation = await kv.get(consultationId);
      
      if (!consultation) {
        return c.json({ error: 'Consultation not found' }, 404);
      }

      if (approved) {
        // Update player health
        const statsKey = `stats:${consultation.userId}`;
        let stats = await kv.get(statsKey) || { health: 100, hunger: 100, thirst: 100, alcoholism: 0 };
        
        if (consultation.consultationType === 'complete') {
          stats.health = 100;
        } else {
          stats.health = Math.min(100, stats.health + consultation.healthBoost);
        }
        
        await kv.set(statsKey, stats);
        consultation.status = 'approved';
      } else {
        // Refund the cost
        const userProfile = await kv.get(`user:${consultation.userId}`);
        userProfile.wallet = (userProfile.wallet || 0) + consultation.cost;
        await kv.set(`user:${consultation.userId}`, userProfile);
        consultation.status = 'rejected';
      }

      await kv.set(consultationId, consultation);
      return c.json({ success: true });
    }

    if (type === 'getRanchoStatus') {
      const ranchoData = await kv.get('rancho:lastUsed');
      return c.json({ lastUsed: ranchoData?.timestamp || null });
    }

    if (type === 'useRancho') {
      const { accessToken } = body;
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (!user || authError) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Check cooldown
      const ranchoData = await kv.get('rancho:lastUsed');
      if (ranchoData?.timestamp) {
        const lastUsed = new Date(ranchoData.timestamp).getTime();
        const now = Date.now();
        const hoursPassed = (now - lastUsed) / (1000 * 60 * 60);
        
        if (hoursPassed < 24) {
          return c.json({ error: 'Rancho on cooldown' }, 400);
        }
      }

      // Restore all players' stats to 100%
      const allStats = await kv.getByPrefix('stats:');
      for (const stat of allStats) {
        const statsKey = stat.key || `stats:${stat.userId}`;
        await kv.set(statsKey, {
          health: 100,
          hunger: 100,
          thirst: 100,
          alcoholism: 0
        });
      }

      // Update rancho timestamp
      await kv.set('rancho:lastUsed', { timestamp: new Date().toISOString() });
      
      return c.json({ success: true });
    }

    if (type === 'transferMoney') {
      const { accessToken, recipientId, amount } = body;
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (!user || authError) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const senderProfile = await kv.get(`user:${user.id}`);
      const recipientProfile = await kv.get(`user:${recipientId}`);

      if (!recipientProfile) {
        return c.json({ error: 'Recipient not found' }, 404);
      }

      if ((senderProfile.wallet || 0) < amount) {
        return c.json({ error: 'Insufficient funds' }, 400);
      }

      // Transfer money
      senderProfile.wallet = (senderProfile.wallet || 0) - amount;
      recipientProfile.wallet = (recipientProfile.wallet || 0) + amount;

      await kv.set(`user:${user.id}`, senderProfile);
      await kv.set(`user:${recipientId}`, recipientProfile);

      // Record transaction
      const transactionId = `transaction:${Date.now()}-${user.id}`;
      await kv.set(transactionId, {
        transactionId,
        from: user.id,
        to: recipientId,
        amount,
        createdAt: new Date().toISOString()
      });

      return c.json({ success: true });
    }

    if (type === 'getAllUsers') {
      const { accessToken } = body;
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (!user || authError) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const allUsers = await kv.getByPrefix('user:');
      const users = allUsers
        .filter((u: any) => u.userId && u.username)
        .map((u: any) => ({
          userId: u.userId,
          username: u.username,
          avatarUrl: u.avatarUrl
        }));

      return c.json({ users });
    }

    return c.json({ error: 'Unknown request type' }, 400);
  } catch (error) {
    console.error('Error in server endpoint:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);