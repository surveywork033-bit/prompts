import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

// Safe Supabase client initialization
let supabaseClient: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    let url = (process.env.SUPABASE_URL || "https://xnqwawwhdpbqwyjhgzao.supabase.co").trim();
    
    // Thoroughly clean any leading/trailing quotes (regular or smart ones)
    url = url.replace(/^["'“”‘’]|["'“”‘’]$/g, "").trim();
    
    // Squeeze out any accidental suffix path like /rest/v1 or /storage/v1 if included in developer settings
    url = url.split("/rest/v1")[0].split("/storage/v1")[0].split("/storage/v1/s3")[0].trim();
    
    while (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    
    let key = (process.env.SUPABASE_KEY || "sb_publishable_SzNu__KJ4i5HwmWl6g9gNQ_0MeCqyW8").trim();
    key = key.replace(/^["'“”‘’]|["'“”‘’]$/g, "").trim();
    
    console.log("[Supabase Init] Initializing with sanitized URL:", url, "Key length:", key.length);
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// Safe Gemini client initialization
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI:", err);
      }
    }
  }
  return aiClient;
}

// Ensure database file exists with initial mock data
function ensureDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Pre-configured elegant category list
  const defaultCategories = [
    { id: "cat_trending", name: "Trending", coverImage: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=500&q=80" },
    { id: "cat_new", name: "New", coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80" },
    { id: "cat_chatgpt", name: "ChatGPT", coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80" },
    { id: "cat_gemini", name: "Gemini", coverImage: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&q=80" },
    { id: "cat_midjourney", name: "Midjourney", coverImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&q=80" },
    { id: "cat_coding", name: "Coding", coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80" },
    { id: "cat_business", name: "Business", coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80" },
    { id: "cat_marketing", name: "Marketing", coverImage: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&q=80" },
    { id: "cat_education", name: "Education", coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80" },
    { id: "cat_gaming", name: "Gaming", coverImage: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&q=80" },
    { id: "cat_productivity", name: "Productivity", coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80" },
    { id: "cat_content", name: "Content Creation", coverImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80" }
  ];

  const defaultUsers = [
    {
      id: "usr_admin",
      username: "admin",
      password: "adminpass",
      email: "admin@promptverse.ai",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces",
      bio: "Official System Administrative Overseer. Full permissions verified.",
      followersCount: 0,
      followingCount: 0,
      badge: ["Admin", "Verified"],
      role: "admin",
      banned: false,
      createdAt: new Date().toISOString()
    }
  ];

  const defaultPrompts: any[] = [];

  if (!fs.existsSync(DB_PATH)) {
    const freshDb = {
      users: defaultUsers,
      categories: defaultCategories,
      prompts: defaultPrompts,
      comments: [],
      likes: [],
      saves: [],
      followers: [],
      notifications: [],
      activities: [],
      reports: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(freshDb, null, 2), "utf8");
    console.log("Database initialized & seeded successfully at:", DB_PATH);
  } else {
    // Ensure categories exists even if database was created previously
    try {
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      let updated = false;
      if (!db.categories || db.categories.length === 0) {
        db.categories = defaultCategories;
        updated = true;
      }
      // Guarantee copiesCount in seed prompts
      if (db.prompts && db.prompts.length > 0) {
        db.prompts.forEach((p: any) => {
          if (p.copiesCount === undefined) {
            p.copiesCount = Math.floor(Math.random() * 40) + 5;
            updated = true;
          }
        });
      }
      if (updated) {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
      }
    } catch (e) {
      console.error("Exception checking pre-existing DB structure", e);
    }
  }
}

// Low-level helper to query database
function getDb() {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.categories) parsed.categories = [];
    return parsed;
  } catch (err) {
    console.error("Error reading database:", err);
    return {
      users: [],
      categories: [],
      prompts: [],
      comments: [],
      likes: [],
      saves: [],
      followers: [],
      notifications: [],
      activities: [],
      reports: []
    };
  }
}

// Low-level helper to write database
function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

ensureDatabase();

// --- API API HANDLERS ---

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  
  const user = db.users.find((u: any) => u.email === email);
  if (user) {
    if (user.banned) {
      return res.status(403).json({ error: "Access Denied: This account has been permanently administrative-banned from the platform." });
    }
    // Verify password if it matches seeded standard user settings
    if (user.password && password && user.password !== password) {
      return res.status(401).json({ error: "Invalid password authorization mismatch." });
    }
    res.json({ token: `token_${user.id}`, user });
  } else {
    const username = email.split("@")[0] || "user_" + Math.floor(Math.random() * 1000);
    const newUser = {
      id: "usr_" + Math.floor(Math.random() * 100000),
      username,
      password: password || "userpass",
      email,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces`,
      bio: "Newly joined prompt voyager. Curious explorer of Promptshare landscapes.",
      followersCount: 0,
      followingCount: 0,
      badge: ["Voyager"],
      role: email.toLowerCase().includes("admin") ? "admin" : "user",
      banned: false,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDb(db);
    res.json({ token: `token_${newUser.id}`, user: newUser });
  }
});

app.post("/api/auth/signup", (req, res) => {
  const { username, email } = req.body;
  const db = getDb();
  const existing = db.users.find((u: any) => u.email === email || u.username === username);
  if (existing) {
    return res.status(400).json({ error: "Email or Username already taken." });
  }
  const newUser = {
    id: "usr_" + Math.floor(Math.random() * 100000),
    username,
    email,
    avatar: `https://images.unsplash.com/photo-${1533500000000 + Math.floor(Math.random() * 1100000)}?w=150&h=150&fit=crop&crop=faces`,
    bio: "Passionate storyteller and futuristic prompt designer.",
    followersCount: 0,
    followingCount: 0,
    badge: ["Voyager"],
    role: email.toLowerCase().includes("admin") ? "admin" : "user",
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  saveDb(db);
  res.json({ token: `token_${newUser.id}`, user: newUser });
});

// Profile Routes
app.get("/api/user/profile/:id", (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const user = db.users.find((u: any) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User profile not found" });
  }
  res.json(user);
});

app.put("/api/user/profile", (req, res) => {
  const { id, username, bio, avatar } = req.body;
  const db = getDb();
  const userIndex = db.users.findIndex((u: any) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User profile not found" });
  }
  db.users[userIndex] = {
    ...db.users[userIndex],
    username: username || db.users[userIndex].username,
    bio: bio !== undefined ? bio : db.users[userIndex].bio,
    avatar: avatar || db.users[userIndex].avatar
  };
  // Propagate updated credentials to prompt creator references
  db.prompts = db.prompts.map((p: any) => {
    if (p.creatorId === id) {
      return {
        ...p,
        creatorName: username || p.creatorName,
        creatorAvatar: avatar || p.creatorAvatar
      };
    }
    return p;
  });
  saveDb(db);
  res.json(db.users[userIndex]);
});

// Prompt Routes
app.get("/api/prompts", (req, res) => {
  const db = getDb();
  let list = [...db.prompts];

  // Filtering
  const { category, tag, search, sort } = req.query;
  if (category && category !== "All") {
    list = list.filter((p: any) => p.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (tag) {
    list = list.filter((p: any) => p.tags.includes(tag as string));
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((p: any) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags.some((t: string) => t.toLowerCase().includes(q)) ||
      p.creatorName.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === "trending") {
    list.sort((a: any, b: any) => (b.likesCount * 3 + b.viewsCount) - (a.likesCount * 3 + a.viewsCount));
  } else if (sort === "featured") {
    list.sort((a: any, b: any) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  } else {
    // latest
    list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(list);
});

app.get("/api/prompts/:id", (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const promptIdx = db.prompts.findIndex((p: any) => p.id === id);
  if (promptIdx === -1) {
    return res.status(404).json({ error: "Prompt not found" });
  }
  // Increment view count
  db.prompts[promptIdx].viewsCount += 1;
  saveDb(db);
  res.json(db.prompts[promptIdx]);
});

app.post("/api/prompts", (req, res) => {
  const { title, description, content, tags, category, coverImage, creatorId } = req.body;
  const db = getDb();
  
  let creator = db.users.find((u: any) => u.id === creatorId);
  if (!creator) {
    // Dynamically preserve / recreate user to prevent publishing failure after server restarts/resets
    creator = {
      id: creatorId || "usr_" + Math.floor(Math.random() * 100000),
      username: "voyager_" + Math.floor(Math.random() * 1000),
      password: "userpass",
      email: "voyager@neural.net",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
      bio: "Futuristic prompt designer.",
      followersCount: 0,
      followingCount: 0,
      badge: ["Voyager"],
      role: "user",
      banned: false,
      createdAt: new Date().toISOString()
    };
    db.users.push(creator);
    saveDb(db);
  }

  const newPrompt = {
    id: "pr_" + Math.floor(Math.random() * 1000000),
    title,
    description,
    content,
    tags: Array.isArray(tags) ? tags : [],
    category: category || "General",
    coverImage: coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    likesCount: 0,
    savesCount: 0,
    viewsCount: 1,
    createdAt: new Date().toISOString(),
    creatorId: creator.id,
    creatorName: creator.username,
    creatorAvatar: creator.avatar,
    creatorVerified: Array.isArray(creator.badge) && creator.badge.includes("Verified"),
    isFeatured: false
  };

  db.prompts.push(newPrompt);

  // Add social activity
  db.activities.unshift({
    id: "ac_" + Math.floor(Math.random() * 1000000),
    userId: creator.id,
    username: creator.username,
    userAvatar: creator.avatar,
    action: `shared a beautiful prompt in ${category}`,
    targetId: newPrompt.id,
    targetTitle: newPrompt.title,
    createdAt: new Date().toISOString()
  });

  saveDb(db);

  // Synchronize with Supabase database (Graceful catch in case table is pending)
  try {
    const supabase = getSupabase();
    supabase.from("posts").insert([{
      id: newPrompt.id,
      title: newPrompt.title,
      description: newPrompt.description,
      content: newPrompt.content,
      category: newPrompt.category,
      tags: newPrompt.tags,
      cover_image: newPrompt.coverImage,
      creator_id: newPrompt.creatorId,
      creator_name: newPrompt.creatorName,
      creator_avatar: newPrompt.creatorAvatar,
      created_at: newPrompt.createdAt
    }]).then(({ error }) => {
      if (error) {
        console.warn("Supabase database insert warning (table 'posts' may not exist yet):", error.message);
      } else {
        console.log("Uploaded post successfully saved to Supabase 'posts' database table.");
      }
    });
  } catch (supabaseDbErr: any) {
    console.error("Supabase Database Sync Exception:", supabaseDbErr.message || supabaseDbErr);
  }

  res.status(201).json(newPrompt);
});

app.put("/api/prompts/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, content, tags, category, coverImage } = req.body;
  const db = getDb();
  const pIdx = db.prompts.findIndex((p: any) => p.id === id);
  if (pIdx === -1) {
    return res.status(404).json({ error: "Prompt not found" });
  }

  db.prompts[pIdx] = {
    ...db.prompts[pIdx],
    title: title || db.prompts[pIdx].title,
    description: description || db.prompts[pIdx].description,
    content: content || db.prompts[pIdx].content,
    tags: tags || db.prompts[pIdx].tags,
    category: category || db.prompts[pIdx].category,
    coverImage: coverImage || db.prompts[pIdx].coverImage
  };

  saveDb(db);
  res.json(db.prompts[pIdx]);
});

app.delete("/api/prompts/:id", (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const originalLen = db.prompts.length;
  db.prompts = db.prompts.filter((p: any) => p.id !== id);

  if (db.prompts.length === originalLen) {
    return res.status(404).json({ error: "Prompt not found" });
  }

  saveDb(db);
  res.json({ success: true, message: "Prompt deleted successfully" });
});

// Interactions (Likes, Saves, Comments, Follows)
app.post("/api/prompts/:id/like", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const db = getDb();

  const promptIdx = db.prompts.findIndex((p: any) => p.id === id);
  if (promptIdx === -1) {
    return res.status(404).json({ error: "Prompt not found" });
  }

  const existingIdx = db.likes.findIndex((l: any) => l.userId === userId && l.promptId === id);
  const prompt = db.prompts[promptIdx];

  if (existingIdx !== -1) {
    // Unlike
    db.likes.splice(existingIdx, 1);
    prompt.likesCount = Math.max(0, prompt.likesCount - 1);
    saveDb(db);
    res.json({ liked: false, likesCount: prompt.likesCount });
  } else {
    // Like
    db.likes.push({
      id: "lk_" + Math.floor(Math.random() * 1000000),
      userId,
      promptId: id
    });
    prompt.likesCount += 1;

    // Send notification if liking someone else's work
    if (prompt.creatorId !== userId) {
      const liker = db.users.find((u: any) => u.id === userId);
      db.notifications.unshift({
        id: "nt_" + Math.floor(Math.random() * 1000000),
        userId: prompt.creatorId,
        type: "like",
        title: "Prompt Liked!",
        message: `${liker ? liker.username : "Someone"} liked your prompt: "${prompt.title}".`,
        read: false,
        createdAt: new Date().toISOString(),
        link: id
      });
    }

    saveDb(db);
    res.json({ liked: true, likesCount: prompt.likesCount });
  }
});

app.post("/api/prompts/:id/save", (req, res) => {
  const { id } = req.params;
  const { userId, folderName } = req.body;
  const db = getDb();

  const promptIdx = db.prompts.findIndex((p: any) => p.id === id);
  if (promptIdx === -1) {
    return res.status(404).json({ error: "Prompt not found" });
  }

  const existingIdx = db.saves.findIndex((s: any) => s.userId === userId && s.promptId === id);
  const prompt = db.prompts[promptIdx];

  if (existingIdx !== -1) {
    // Unsave
    db.saves.splice(existingIdx, 1);
    prompt.savesCount = Math.max(0, prompt.savesCount - 1);
    saveDb(db);
    res.json({ saved: false, savesCount: prompt.savesCount });
  } else {
    // Save
    db.saves.push({
      id: "sv_" + Math.floor(Math.random() * 1000000),
      userId,
      promptId: id,
      folderName: folderName || "Core Matrix"
    });
    prompt.savesCount += 1;

    // Notify prompt author
    if (prompt.creatorId !== userId) {
      const saver = db.users.find((u: any) => u.id === userId);
      db.notifications.unshift({
        id: "nt_" + Math.floor(Math.random() * 1000000),
        userId: prompt.creatorId,
        type: "save",
        title: "Prompt Saved!",
        message: `${saver ? saver.username : "Someone"} bookmarked your prompt: "${prompt.title}".`,
        read: false,
        createdAt: new Date().toISOString(),
        link: id
      });
    }

    saveDb(db);
    res.json({ saved: true, savesCount: prompt.savesCount });
  }
});

app.get("/api/prompts/:id/comments", (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const comments = db.comments.filter((c: any) => c.promptId === id);
  res.json(comments);
});

app.post("/api/prompts/:id/comments", (req, res) => {
  const { id } = req.params;
  const { userId, content } = req.body;
  const db = getDb();

  const prompt = db.prompts.find((p: any) => p.id === id);
  if (!prompt) {
    return res.status(404).json({ error: "Prompt not found" });
  }

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const newComment = {
    id: "cm_" + Math.floor(Math.random() * 1000000),
    promptId: id,
    userId,
    userName: user.username,
    userAvatar: user.avatar,
    content,
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);

  // Send notification to author
  if (prompt.creatorId !== userId) {
    db.notifications.unshift({
      id: "nt_" + Math.floor(Math.random() * 1000000),
      userId: prompt.creatorId,
      type: "comment",
      title: "New Dialogue Triggered",
      message: `${user.username} commented on "${prompt.title}": "${content.slice(0, 40)}${content.length > 40 ? "..." : ""}"`,
      read: false,
      createdAt: new Date().toISOString(),
      link: id
    });
  }

  saveDb(db);
  res.status(201).json(newComment);
});

// Followers
app.post("/api/users/:id/follow", (req, res) => {
  const { id } = req.params; // target user to follow
  const { followerId } = req.body; // active user
  const db = getDb();

  if (id === followerId) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const targetIdx = db.users.findIndex((u: any) => u.id === id);
  const followerIdx = db.users.findIndex((u: any) => u.id === followerId);

  if (targetIdx === -1 || followerIdx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const followIdx = db.followers.findIndex((f: any) => f.followerId === followerId && f.followingId === id);

  if (followIdx !== -1) {
    // Unfollow
    db.followers.splice(followIdx, 1);
    db.users[targetIdx].followersCount = Math.max(0, db.users[targetIdx].followersCount - 1);
    db.users[followerIdx].followingCount = Math.max(0, db.users[followerIdx].followingCount - 1);
    saveDb(db);
    res.json({ following: false, followersCount: db.users[targetIdx].followersCount });
  } else {
    // Follow
    db.followers.push({
      id: "fl_" + Math.floor(Math.random() * 1000000),
      followerId,
      followingId: id
    });
    db.users[targetIdx].followersCount += 1;
    db.users[followerIdx].followingCount += 1;

    // Send Notification to followed user
    db.notifications.unshift({
      id: "nt_" + Math.floor(Math.random() * 1000000),
      userId: id,
      type: "follow",
      title: "New Follower",
      message: `${db.users[followerIdx].username} started following you.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({ following: true, followersCount: db.users[targetIdx].followersCount });
  }
});

// Notifications
app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  const db = getDb();
  let list = db.notifications;
  if (userId) {
    list = list.filter((n: any) => n.userId === userId);
  }
  res.json(list);
});

app.post("/api/notifications/read", (req, res) => {
  const { userId } = req.body;
  const db = getDb();
  db.notifications = db.notifications.map((n: any) => {
    if (n.userId === userId) {
      return { ...n, read: true };
    }
    return n;
  });
  saveDb(db);
  res.json({ success: true });
});

// Admin Moderation / Analytics
app.get("/api/admin/analytics", (req, res) => {
  const db = getDb();
  const totalPrompts = db.prompts.length;
  const totalUsers = db.users.length;
  const totalComments = db.comments.length;
  const totalLikes = db.likes.length;

  res.json({
    totalPrompts,
    totalUsers,
    totalComments,
    totalLikes,
    totalCopies: db.prompts.reduce((sum: number, p: any) => sum + (p.copiesCount || 0), 0),
    reports: db.reports || [],
    recentlyActive: db.users.slice(0, 5),
    promptPopularity: [...db.prompts]
      .sort((a, b) => (b.copiesCount || 0) - (a.copiesCount || 0))
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        views: p.viewsCount,
        likes: p.likesCount,
        copies: p.copiesCount || 0,
        coverImage: p.coverImage
      }))
  });
});

// Copy prompt action route
app.post("/api/prompts/:id/copy", (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.prompts.findIndex((p: any) => p.id === id);
  if (idx !== -1) {
    if (!db.prompts[idx].copiesCount) db.prompts[idx].copiesCount = 0;
    db.prompts[idx].copiesCount += 1;
    saveDb(db);
    return res.json({ success: true, copiesCount: db.prompts[idx].copiesCount });
  }
  res.status(404).json({ error: "Prompt not found" });
});

// Category Management CRUD
app.get("/api/admin/categories", (req, res) => {
  const db = getDb();
  res.json(db.categories || []);
});

app.post("/api/admin/categories", (req, res) => {
  const { name, coverImage } = req.body;
  const db = getDb();
  if (!db.categories) db.categories = [];
  const newCat = {
    id: "cat_" + Math.floor(Math.random() * 100000),
    name,
    coverImage: coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80"
  };
  db.categories.push(newCat);
  saveDb(db);
  res.status(201).json(newCat);
});

app.put("/api/admin/categories/:id", (req, res) => {
  const { id } = req.params;
  const { name, coverImage } = req.body;
  const db = getDb();
  const idx = db.categories.findIndex((c: any) => c.id === id);
  if (idx !== -1) {
    db.categories[idx] = {
      ...db.categories[idx],
      name: name || db.categories[idx].name,
      coverImage: coverImage || db.categories[idx].coverImage
    };
    saveDb(db);
    return res.json(db.categories[idx]);
  }
  res.status(404).json({ error: "Category not found" });
});

app.delete("/api/admin/categories/:id", (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const src = db.categories || [];
  db.categories = src.filter((c: any) => c.id !== id);
  saveDb(db);
  res.json({ success: true });
});

// User Management CRUD
app.get("/api/admin/users", (req, res) => {
  const db = getDb();
  const sanitized = db.users.map(({ password, ...u }: any) => u);
  res.json(sanitized);
});

app.put("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const { role, banned, badge } = req.body;
  const db = getDb();
  const idx = db.users.findIndex((u: any) => u.id === id);
  if (idx !== -1) {
    db.users[idx] = {
      ...db.users[idx],
      role: role !== undefined ? role : db.users[idx].role,
      banned: banned !== undefined ? banned : db.users[idx].banned,
      badge: badge !== undefined ? badge : db.users[idx].badge
    };
    saveDb(db);
    const { password, ...sanitized } = db.users[idx];
    return res.json(sanitized);
  }
  res.status(404).json({ error: "User profile not found" });
});

app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const db = getDb();
  db.users = db.users.filter((u: any) => u.id !== id);
  saveDb(db);
  res.json({ success: true });
});

app.post("/api/admin/prompts/:id/feature", (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;
  const db = getDb();

  const pIdx = db.prompts.findIndex((p: any) => p.id === id);
  if (pIdx === -1) {
    return res.status(404).json({ error: "Prompt not found" });
  }

  db.prompts[pIdx].isFeatured = isFeatured;
  saveDb(db);
  res.json(db.prompts[pIdx]);
});

app.post("/api/admin/reports", (req, res) => {
  const { promptId, reporterId, reason } = req.body;
  const db = getDb();

  if (!db.reports) db.reports = [];

  const newReport = {
    id: "rep_" + Math.floor(Math.random() * 100000),
    promptId,
    reason,
    reporterId,
    createdAt: new Date().toISOString()
  };

  db.reports.push(newReport);
  saveDb(db);
  res.status(201).json(newReport);
});

// --- DYNAMIC AI GEMINI CO-PILOT SERVICES ---

// Enhance a draft prompt using Gemini (gemini-3.5-flash)
app.post("/api/gemini/enhance", async (req, res) => {
  const { draftPrompt, category } = req.body;

  if (!draftPrompt) {
    return res.status(400).json({ error: "Draft prompt text is required to enhance." });
  }

  const gemini = getGemini();

  if (!gemini) {
    // If API key is missing or not configured, use procedural elite fallback
    const mockTitles = [
      "Dynamic Neo-Renaissance Vector Blueprint",
      "Robust Zero-Knowledge Authentication Engine",
      "Hyper-Personalized Emotional Copywriting Funnel",
      "Autonomous SEO Semantic Document Structurer"
    ];
    const chosenTitle = mockTitles[Math.floor(Math.random() * mockTitles.length)];

    const feedbackText = `### Enhanced System Instruction
Customize the system state before loading [USER INPUT]:
- Maintain strict architectural consistency.
- Format all numeric structures with standard high-contrast dividers.

### Standard Template Pattern
"${draftPrompt} [CUSTOMIZE VARIABLES HERE]"`;

    return res.json({
      enhancedText: feedbackText,
      title: chosenTitle,
      description: `Premium optimized prompt layout for ${category || "General"} system queries.`,
      tags: ["generative", "engineered-prompt", category?.toLowerCase() || "ai"].filter(Boolean)
    });
  }

  try {
    const promptInstructions = `
      You are an Expert Prompt Engineer and AI Specialist.
      You are given a raw, simple, draft prompt text: "${draftPrompt}".
      The target domain/category is: "${category || 'General'}".
      
      Generate a sophisticated, premium, robustly engineered version of this prompt that includes:
      1. Clear contextual roles (e.g., "Act as an Expert...")
      2. Specific formatting constraints and execution boundaries.
      3. Placeholders like [INSERT VARIABLES HERE] for customization.
      
      Return your output as a clean, structured JSON object with EXACTLY the following keys:
      {
        "title": "A highly catchy, premium title for the prompt (4-6 words)",
        "description": "An attractive, one-sentence description explaining what this prompt accomplishes.",
        "enhancedText": "The fully engineered prompt content with deep instructions and variable markers.",
        "tags": ["3", "to", "5", "lowercase", "searchable", "tags"]
      }
      
      Ensure your response is valid JSON only. Do not include extra wrappers or explanation outside of JSON.
    `;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptInstructions,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            enhancedText: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "enhancedText", "tags"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    const result = JSON.parse(jsonStr);
    res.json(result);

  } catch (err: any) {
    console.error("Gemini enhancement failed:", err);
    res.status(500).json({ error: "Gemini enhancement service failed: " + err.message });
  }
});

// Generate dynamic glassmorphic backgrounds for cover images using Gemini 2.5 Image Generator or a responsive abstract SVG pattern
app.post("/api/gemini/generate-image", async (req, res) => {
  const { promptTitle, promptCategory } = req.body;
  const gemini = getGemini();

  // If no Gemini, fallback to procedural aesthetic gradient pattern generator
  const presets = [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80"
  ];
  const cover = presets[Math.floor(Math.random() * presets.length)];

  if (!gemini) {
    return res.json({ imageUrl: cover, isProcedural: true });
  }

  try {
    // Generate image using general image task
    const imgPrompt = `Abstract cyberpunk digital glassmorphism, iridescent high-contrast ${promptCategory || 'AI technology'} visual motif of ${promptTitle || 'promptverse conceptual portal'}, colorful glows, premium vector backdrop.`;
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: imgPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64 = part.inlineData.data;
        const imageUrl = `data:image/png;base64,${base64}`;
        return res.json({ imageUrl, isProcedural: false });
      }
    }

    res.json({ imageUrl: cover, isProcedural: true });

  } catch (err: any) {
    console.error("Gemini image generation failed:", err);
    res.json({ imageUrl: cover, isProcedural: true });
  }
});

app.post("/api/upload-image", async (req, res) => {
  try {
    const { filename, filetype, base64 } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: "Missing required upload files / details" });
    }

    const supabase = getSupabase();

    // 1. Ensure the 'posts' storage bucket exists and is accessible
    const bucketName = "posts";
    console.log("[Supabase Upload] Verifying bucket exists:", bucketName);
    try {
      const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
      if (getBucketsError) {
        console.error("[Supabase Upload] listBuckets error:", getBucketsError);
      } else {
        const hasPostsBucket = buckets?.some(b => b.name === bucketName);
        if (!hasPostsBucket) {
          console.log("[Supabase Upload] 'posts' bucket does not exist. Creating it now...");
          const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760 // 10mb limit
          });
          if (createBucketError) {
            console.error("[Supabase Upload] Failed to create bucket 'posts':", createBucketError);
          } else {
            console.log("[Supabase Upload] 'posts' bucket created successfully!");
          }
        }
      }
    } catch (bucketExc) {
      console.warn("[Supabase Upload] Bucket availability verification exception:", bucketExc);
    }

    // 2. Generate clean, valid, and absolute unique filename for the upload: timestamp-random.extension
    const ext = path.extname(filename).toLowerCase().replace(".", "") || "png";
    const filePath = `${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}.${ext}`;

    console.log("[Supabase Upload] Audited details - bucket name:", bucketName);
    console.log("[Supabase Upload] Audited details - file path:", filePath);

    // Convert base64 payload back to server Buffer representing the file
    const file = Buffer.from(base64, "base64");

    // 3. Upload file buffer to Supabase 'posts' bucket using audited API path
    const { data: uploadResponse, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: filetype || "image/png",
        upsert: true
      });

    console.log("[Supabase Upload] upload response structure:", { uploadResponse, uploadError });

    if (uploadError) {
      console.error("[Supabase Upload] Storage upload error detail:", uploadError);
      return res.status(500).json({ error: `Supabase upload error: ${uploadError.message}` });
    }

    // 4. Retrieve public downloadable URL
    const { data: publicUrlResponse } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log("[Supabase Upload] public URL response structure:", publicUrlResponse);

    if (!publicUrlResponse || !publicUrlResponse.publicUrl) {
      return res.status(500).json({ error: "Failed to resolve public image URL from storage" });
    }

    console.log("[Supabase Upload] Successful. Public URL resolved:", publicUrlResponse.publicUrl);
    res.json({ success: true, publicUrl: publicUrlResponse.publicUrl });

  } catch (err: any) {
    console.error("[Supabase Upload] handler exception:", err);
    res.status(500).json({ error: `Upload handler exception: ${err.message || err}` });
  }
});

app.get("/api/supabase-status", async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Test database connectivity
    let dbStatus = "connected";
    let dbErrorDetail = null;
    try {
      const { data, error } = await supabase.from("posts").select("id").limit(1);
      if (error) {
        dbStatus = "limited (table 'posts' may not exist yet, SQL schema pending)";
        dbErrorDetail = error.message;
      }
    } catch (e: any) {
      dbStatus = "disconnected";
      dbErrorDetail = e.message;
    }

    // Test storage connectivity
    let storageStatus = "connected";
    let storageErrorDetail = null;
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        storageStatus = "error";
        storageErrorDetail = error.message;
      } else {
        const postsExists = buckets?.some(b => b.name === "posts");
        storageStatus = postsExists ? "connected (bucket 'posts' verified)" : "connected (bucket 'posts' pending first create)";
      }
    } catch (e: any) {
      storageStatus = "disconnected";
      storageErrorDetail = e.message;
    }

    res.json({
      supabaseConnected: true,
      url: process.env.SUPABASE_URL || "https://xnqwawwhdpbqwyjhgzao.supabase.co",
      storage: {
        status: storageStatus,
        bucket: "posts",
        error: storageErrorDetail
      },
      database: {
        status: dbStatus,
        error: dbErrorDetail
      }
    });

  } catch (err: any) {
    res.status(500).json({
      supabaseConnected: false,
      error: err.message || err
    });
  }
});

app.post("/api/checkout", async (req, res) => {
  try {
    const supabase = getSupabase();
    // Assuming we insert into a table named 'orders'
    const { data, error } = await supabase
      .from("orders")
      .insert([req.body])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, order: data });
  } catch (err: any) {
    console.error("Checkout route error:", err);
    res.status(500).json({ error: "Failed to process checkout" });
  }
});

// Standard Full Stack routing context (Vite vs Prod)
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PROMPTVERSE Server boot success: http://localhost:${PORT}`);
  });
}

bootServer().catch((e) => {
  console.error("Failed to boot PROMPTVERSE server:", e);
});
