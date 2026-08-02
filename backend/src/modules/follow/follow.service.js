const { AppError } = require("../../utils/helpers");
const { createNotification } = require("../notification/notification.service");
const User = require("../user/user.model");
const Notification = require("../notification/notification.model");

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

  const isFollowing = (targetUser.followers || []).some(
    (entry) => String(entry) === String(userId)
  );

  const isRequested = (targetUser.followRequests || []).some(
    (entry) => String(entry) === String(userId)
  );

  if (isFollowing) {
    currentUser.following.pull(targetUserId);
    targetUser.followers.pull(userId);
    if (currentUser.requestedFollows) currentUser.requestedFollows.pull(targetUserId);
    if (targetUser.followRequests) targetUser.followRequests.pull(userId);
    await Promise.all([currentUser.save(), targetUser.save()]);

    await Notification.deleteMany({
      recipient: targetUserId,
      actor: userId,
      type: "follow"
    });

    return {
      following: false,
      requested: false,
      targetUserId,
      followersCount: targetUser.followers.length
    };
  }

  if (isRequested) {
    if (currentUser.requestedFollows) currentUser.requestedFollows.pull(targetUserId);
    if (targetUser.followRequests) targetUser.followRequests.pull(userId);
    await Promise.all([currentUser.save(), targetUser.save()]);

    await Notification.deleteMany({
      recipient: targetUserId,
      actor: userId,
      type: "follow_request"
    });

    return {
      following: false,
      requested: false,
      targetUserId,
      followersCount: targetUser.followers.length
    };
  }

  // Handle new follow attempt
  if (targetUser.isPrivate) {
    if (!targetUser.followRequests) targetUser.followRequests = [];
    if (!currentUser.requestedFollows) currentUser.requestedFollows = [];
    targetUser.followRequests.addToSet(userId);
    currentUser.requestedFollows.addToSet(targetUserId);
    await Promise.all([currentUser.save(), targetUser.save()]);

    await createNotification({
      recipient: targetUserId,
      actor: userId,
      type: "follow_request",
      entityId: userId,
      entityModel: "User",
      message: "requested to follow you"
    });

    return {
      following: false,
      requested: true,
      targetUserId,
      followersCount: targetUser.followers.length
    };
  }

  // Public user -> Immediate follow
  currentUser.following.addToSet(targetUserId);
  targetUser.followers.addToSet(userId);
  await Promise.all([currentUser.save(), targetUser.save()]);

  await createNotification({
    recipient: targetUserId,
    actor: userId,
    type: "follow",
    entityId: targetUserId,
    entityModel: "User",
    message: "started following you"
  });

  return {
    following: true,
    requested: false,
    targetUserId,
    followersCount: targetUser.followers.length
  };
}

async function acceptFollowRequest(userId, requesterId) {
  const [currentUser, requester] = await Promise.all([
    User.findById(userId),
    User.findById(requesterId)
  ]);

  if (!currentUser || !requester) {
    throw new AppError(404, "User not found");
  }

  if (currentUser.followRequests) currentUser.followRequests.pull(requesterId);
  if (requester.requestedFollows) requester.requestedFollows.pull(userId);

  currentUser.followers.addToSet(requesterId);
  requester.following.addToSet(userId);

  await Promise.all([currentUser.save(), requester.save()]);

  await Notification.deleteMany({
    recipient: userId,
    actor: requesterId,
    type: "follow_request"
  });

  await createNotification({
    recipient: requesterId,
    actor: userId,
    type: "follow",
    entityId: userId,
    entityModel: "User",
    message: "accepted your follow request"
  });

  return { success: true };
}

async function rejectFollowRequest(userId, requesterId) {
  const [currentUser, requester] = await Promise.all([
    User.findById(userId),
    User.findById(requesterId)
  ]);

  if (!currentUser || !requester) {
    throw new AppError(404, "User not found");
  }

  if (currentUser.followRequests) currentUser.followRequests.pull(requesterId);
  if (requester.requestedFollows) requester.requestedFollows.pull(userId);

  await Promise.all([currentUser.save(), requester.save()]);

  await Notification.deleteMany({
    recipient: userId,
    actor: requesterId,
    type: "follow_request"
  });

  return { success: true };
}

async function removeFollower(userId, followerId) {
  const [currentUser, follower] = await Promise.all([
    User.findById(userId),
    User.findById(followerId)
  ]);

  if (!currentUser || !follower) {
    throw new AppError(404, "User not found");
  }

  // Remove follower from current user's followers
  currentUser.followers.pull(followerId);
  // Remove current user from follower's following
  follower.following.pull(userId);

  await Promise.all([currentUser.save(), follower.save()]);

  // Clean up any follow notifications
  await Notification.deleteMany({
    recipient: userId,
    actor: followerId,
    type: "follow"
  });

  return { success: true, followerId, followersCount: currentUser.followers.length };
}

module.exports = {
  toggleFollow,
  acceptFollowRequest,
  rejectFollowRequest,
  removeFollower
};
