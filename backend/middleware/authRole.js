const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = decoded;
    next();
  });
}

function allowRoles(...roles) {
  return (req, res, next) => {

    if (!roles.includes(req.user.designation)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}

module.exports = { verifyToken, allowRoles };