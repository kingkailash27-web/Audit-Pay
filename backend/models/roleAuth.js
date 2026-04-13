// This middleware checks if the user making the request has the correct role
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Assuming req.user is set after they log in
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Access Denied: You do not have permission to view this page." 
      });
    }
    // If their role is in the allowed list, let them proceed
    next();
  };
};

module.exports = authorizeRoles;