// Allow only regular users to access user-facing account and alert APIs.
const isUser = (req, res, next) => {
  if (req.user?.role !== 'user') {
    return res.status(403).json({ message: 'This feature is available to regular users only' });
  }

  next();
};

module.exports = isUser;