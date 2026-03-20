const { AppError } = require("../../utils/helpers");
const { createNotification } = require("../notification/notification.service");
const User = require("../user/user.model");

async function toggleFollow(userId, targetUserId) {
  if (String(userId) === String(targetUserId)) {
    throw new AppError(400, "You cannot follow yourself");
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(userId),
    User.findById(targetUserId)
  ]);

  if (!currentUser || !targetUser) {
    throw new AppError(404, "User not found");
  }

  const isFollowing = currentUser.following.some(
    (entry) => String(entry) === String(targetUserId)
  );

  if (isFollowing) {
    currentUser.following.pull(targetUserId);
    targetUser.followers.pull(userId);
  } else {
    currentUser.following.addToSet(targetUserId);
    targetUser.followers.addToSet(userId);
  }

  await Promise.all([currentUser.save(), targetUser.save()]);

  if (!isFollowing) {
    await createNotification({
      recipient: targetUserId,
      actor: userId,
      type: "follow",
      entityId: targetUserId,
      entityModel: "User",
      message: "started following you"
    });
  }

  return {
    following: !isFollowing,
    targetUserId,
    followersCount: targetUser.followers.length
  };
}

module.exports = {
  toggleFollow
};
