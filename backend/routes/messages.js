const express = require("express");
const router = express.Router();
const Pusher = require("pusher");
const mongoose = require("mongoose");
const Message = require("../models/Message.js");
const Presence = require("../models/Presence.js");
const User = require("../models/User.js");
const { auth } = require("../middleware/auth.js");

// Pusher initialized inside a getter so env vars are always loaded first
function getPusher() {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    console.warn('Pusher is not fully configured. Skipping realtime triggers.');
    return {
      trigger: async () => {},
    };
  }

  return new Pusher({
    appId:   PUSHER_APP_ID,
    key:     PUSHER_KEY,
    secret:  PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS:  true,
  });
}

// ── GET conversation between two users ────────────────────────────────────────
router.get("/conversation/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;

    const messages = await Message.find({
      isBroadcast: false,
      $or: [
        { senderId: myId,     receiverId: userId },
        { senderId: userId,   receiverId: myId   },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("senderId",   "username role")
      .populate("receiverId", "username role");

    await Message.updateMany(
      { senderId: userId, receiverId: myId, readBy: { $ne: myId } },
      { $addToSet: { readBy: myId } }
    );

    try {
      await getPusher().trigger(`user-${userId}`, "messages-read", { byUserId: myId });
    } catch (triggerErr) {
      console.warn('Failed to send messages-read trigger:', triggerErr.message);
    }

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: "Error fetching messages: " + err.message });
  }
});

// ── GET broadcast messages ─────────────────────────────────────────────────────
router.get("/broadcasts", auth, async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 50;
    const myId  = req.user.id;

    const messages = await Message.find({ isBroadcast: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("senderId", "username role");

    await Message.updateMany(
      { isBroadcast: true, readBy: { $ne: myId } },
      { $addToSet: { readBy: myId } }
    );

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: "Error fetching broadcasts: " + err.message });
  }
});

// ── GET unread counts ──────────────────────────────────────────────────────────
router.get("/unread", auth, async (req, res) => {
  try {
    const myId      = req.user.id;
    const ObjectId  = mongoose.Types.ObjectId; // FIX 1: reference only, use with `new` below

    const directUnread = await Message.aggregate([
      {
        $match: {
          receiverId:  new ObjectId(myId), // FIX 1: was ObjectId(myId) — crashes Mongoose 6+
          isBroadcast: false,
          readBy:      { $ne: new ObjectId(myId) },
        },
      },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ]);

    const broadcastUnread = await Message.countDocuments({
      isBroadcast: true,
      readBy:      { $ne: new ObjectId(myId) },
    });

    const unreadMap = {};
    directUnread.forEach((item) => {
      unreadMap[item._id.toString()] = item.count;
    });

    res.json({ direct: unreadMap, broadcast: broadcastUnread });
  } catch (err) {
    res.status(500).json({ message: "Error fetching unread: " + err.message });
  }
});

// ── POST send direct message ───────────────────────────────────────────────────
router.post("/send", auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Message cannot be empty" });
    if (!receiverId)       return res.status(400).json({ message: "Receiver is required" });

    const sender   = await User.findById(req.user.id).select("username role");
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    if (sender.role === "employee" && receiver.role !== "pd") {
      return res.status(403).json({ message: "Employees can only message the Project Director" });
    }

    const message = new Message({
      senderId:    req.user.id,
      receiverId,
      senderName:  sender.username,
      content:     content.trim(),
      isBroadcast: false,
      readBy:      [req.user.id],
    });
    await message.save();

    const populated = await message.populate([
      { path: "senderId",   select: "username role" },
      { path: "receiverId", select: "username role" },
    ]);

    const pusher = getPusher();
    try {
      await pusher.trigger(`user-${receiverId}`,   "new-message", populated);
      await pusher.trigger(`user-${req.user.id}`,  "new-message", populated);
    } catch (triggerErr) {
      console.warn('Failed to send new-message trigger:', triggerErr.message);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Error sending message: " + err.message });
  }
});

// ── POST broadcast (PD only) ───────────────────────────────────────────────────
router.post("/broadcast", auth, async (req, res) => {
  try {
    const { content } = req.body; // FIX 2: was missing — caused "content is not defined" crash

    if (!content?.trim()) return res.status(400).json({ message: "Message cannot be empty" });

    const sender = await User.findById(req.user.id).select("username role");
    if (!sender || sender.role !== "pd") {
      return res.status(403).json({ message: "Only the Project Director can broadcast." });
    }

    const message = new Message({
      senderId:    req.user.id,
      receiverId:  null,
      senderName:  sender.username,
      content:     content.trim(),
      isBroadcast: true,
      readBy:      [req.user.id],
    });
    await message.save();

    const populated = await message.populate("senderId", "username role");

    try {
      await getPusher().trigger("broadcast-channel", "new-broadcast", populated);
    } catch (triggerErr) {
      console.warn('Failed to send broadcast trigger:', triggerErr.message);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Error sending broadcast: " + err.message });
  }
});

// ── POST presence (online/offline) ────────────────────────────────────────────
router.post("/presence", auth, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findById(req.user.id).select("username");

    await Presence.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, username: user.username, isOnline, lastSeen: new Date() },
      { upsert: true, new: true }
    );

    try {
      await getPusher().trigger("presence-channel", "presence-update", {
        userId:   req.user.id,
        username: user.username,
        isOnline,
        lastSeen: new Date(),
      });
    } catch (triggerErr) {
      console.warn('Failed to send presence trigger:', triggerErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error updating presence: " + err.message });
  }
});

// ── GET all presence statuses ──────────────────────────────────────────────────
router.get("/presence", auth, async (req, res) => {
  try {
    const presences = await Presence.find({});
    res.json(presences);
  } catch (err) {
    res.status(500).json({ message: "Error fetching presence: " + err.message });
  }
});

// ── GET users list (for chat sidebar) ─────────────────────────────────────────
router.get("/users", auth, async (req, res) => {
  try {
    const myId = req.user.id;
    let users;
    if (req.user.role === "pd") {
      users = await User.find({ isActive: true, _id: { $ne: myId } }, "username role _id");
    } else {
      users = await User.find({ role: "pd", isActive: true, _id: { $ne: myId } }, "username role _id");
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users: " + err.message });
  }
});

module.exports = router;
