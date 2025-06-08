var jwt = require("jsonwebtoken");
const BlacklistTokenModel = require("../models/blacklistToken.model");

const authMiddleware = (role) => {
  /// role means array of allowed roles in particular routes
  return async (req, res, next) => {
    let decoded;
    try {
      let token = req.headers?.authorization?.split(" ")[1];
      /// check whether same token is not blacklisted
      let blacklistTokenCheck = await BlacklistTokenModel.exists({ token });
      // exits will give document or null
      // console.log(blacklistTokenCheck)
      if (blacklistTokenCheck) {
        res.status(405).json({ message: "Invalid Token, Please login" });
        return;
      }
      if (token) {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      } else {
        res
          .status(400)
          .json({ message: "Token Not Found, Please Login Again" });
      }
    } catch (err) {
      if (err.message == "jwt expired") {
        /// we need to generate new Access token with the help of Refreshtoken
        /// check the validity of refresh token and issue new AccessToken
        let refreshToken = req.headers?.refreshtoken?.split(" ")[1];
        let blacklistTokenCheck = await BlacklistTokenModel.exists({
          token: refreshToken,
        });

        if (blacklistTokenCheck) {
          res.status(405).json({ message: "Invalid Token, Please login" });
          return;
        }
        let refreshTokenDeocded = jwt.verify(
          refreshToken,
          process.env.JWT_SECRET_KEY
        );
        if (refreshTokenDeocded) {
          console.log("Access Token Expired, New Token Generate");
          /// userId, role from refreshTokenDeocded
          let newAccessToken = jwt.sign(
            {
              userId: refreshTokenDeocded.userId,
              role: refreshTokenDeocded.role,
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: 30 }
          );
          decoded = jwt.verify(newAccessToken, process.env.JWT_SECRET_KEY);
        } else {
          res.status(403).json({ message: "Token Expired, Login Again" });
        }
      } else {
        res.status(500).json({ message: "Something went wrong" });
      }
    }
    if (decoded) {
      if (role.includes(decoded.role)) {
        req.user = decoded.userId;
        next();
      } else {
        res.status(401).json({ message: "Unauthorised...." });
      }
    } else {
      res.status(403).json({ message: "Login Failed, Please Login Again" });
    }
  };
};

module.exports = authMiddleware;
