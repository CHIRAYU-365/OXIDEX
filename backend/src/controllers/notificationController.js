const prisma = require("../utils/prisma");

const getUserNotifications = async (req, res) => {
  try {
    const { userAddress } = req.params;
    const unreadOnly = req.query.unreadOnly === "true";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where = {
      userAddress: userAddress.toLowerCase(),
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const notifications = await prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { userAddress: userAddress.toLowerCase(), isRead: false },
    });

    return res.json({
      success: true,
      data: notifications,
      meta: { page, limit, total, unreadCount },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, error: "Invalid notification ID" });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userAddress } = req.body;
    if (!userAddress) {
      return res.status(400).json({ success: false, error: "userAddress is required" });
    }

    await prisma.notification.updateMany({
      where: { userAddress: userAddress.toLowerCase(), isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
