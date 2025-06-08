const express = require("express");
const bcrypt = require("bcrypt");
const UserModel = require("../models/user.model");
const saltRounds = 9;
const passport = require("passport");
const GitHubStrategy = require("passport-github2");
const nodemailer = require("nodemailer");
var jwt = require("jsonwebtoken");
const BlacklistTokenModel = require("../models/blacklistToken.model");
require("dotenv").config();
// const myPlaintextPassword = "s0//P4$$w0rD";
// const someOtherPlaintextPassword = "not_bacon";

const UserRouter = express.Router();

/// SignUp
/// client username, email & password from req.body
/// npm bycrypt helps to hash the password

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: User signup
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Signup successful
 *       500:
 *         description: Server error
 */


UserRouter.post("/signup", async (req, res) => {
  try {
    ///console.log(req.body)
    const { username, email, password, role } = req.body;
    bcrypt.hash(password, saltRounds, async function (err, hash) {
      if (err) {
        res.status(500).json({ message: "Something went wrong" });
      } else {
        await UserModel.create({ username, email, password: hash, role });
        res.status(201).json({ message: "Signup Sucess" });
      }
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Something went wrong" });
  }
});


/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User Login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login Sucesss
 *       500:
 *         description: Server error
 */
UserRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User Not Found, Please Signup" });
    } else {
      let hash = user.password; /// hashed - stored password from DB
      bcrypt.compare(password, hash).then(function (result) {
        if (result == true) {
          // user role should also be encrypted in the token
          var accessToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: 1200 }
          );
          var refreshToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: 60 }
          );

          res
            .status(200)
            .json({ message: "Login Sucesss", accessToken, refreshToken });
        } else {
          res.status(403).json({ message: "Wrong Password" });
        }
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

//// Github OAuth
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, done) {
      ///console.log(" Profile From Github", profile)
      // done is similar to next in Middleware
      /// done attaches profile to req.user and sends to next route
      return done(null, profile);
    }
  )
);

/// Calls Github Login/Authorization Page
UserRouter.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

/// Callback route in case of login suceess/failure
UserRouter.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login",
  }),
  async function (req, res) {
    ///console.log(req.user.id)
    // req.user is profile, I get user.id and store in github
    const gitHubUserId = req.user.id;
    const user = await UserModel.find({ profileId: gitHubUserId });
    console.log(user);
    if (user.length == 0) {
      // user not found
      /// store user into DB and generate token
      let newUser = await UserModel.create({ profileId: gitHubUserId });
      /// generate token
      var token = jwt.sign(
        { userId: newUser._id, role: newUser.role },
        process.env.JWT_SECRET_KEY
      );
      res.json({ messsage: "New user Login Sucess", token });
    } else {
      // user found, so directly send a token
      var token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET_KEY
      );
      res.status(200).json({ message: "Existing User Login Sucesss", token });
    }
  }
);

//// Sending emails
/// Test Route
// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", /// Simple Mail Transport Protocol
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    /// We cannot directly use Google email and password
    /// Google has security policy
    /// Create An App in Google Account, use that app's password
    user: process.env.GOOGLE_APP_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

UserRouter.get("/sendemail", async (req, res) => {
  const info = await transporter.sendMail({
    from: '"Venugopal Burli" <venugopal@gmail.com>',
    to: "venugopal.burli@masaischool.com",
    subject: "This is test email sent",
    text: "This is text body", // plain‑text body
    //html: "<b>This is HTML body</b>", // HTML body
  });

  res.status(201).json({ message: "Email Sent" });
});

UserRouter.post("/forget-password", async (req, res) => {
  // email is sent through body
  try {
    const { email } = req.body;
    // check whether user is present in DB
    let user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User Not Found" });
    } else {
      /// user found
      // need to send a reset password link to the email
      /// Link should not easliy decodable
      /// let us token??? generate an token will hide userId
      /// localhost:3000/users/reset-password?token=kiuytrhsfdxgchvjklkjyfhtgv
      // Genreal expiry time may be of 20 to 30mins
      let resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: 1200 }
      );
      let resetPasswordLink = `http://localhost:3000/users/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: '"Venugopal Burli" ',
        to: user.email,
        subject: "Password Reset Link",
        html: `<p>Dear ${user.username}, here is the password reset link, please finish the process with 20 mins</p>
        <h4>${resetPasswordLink}</h4>`, // HTML body
      });
      res.json({ message: "Password Reset Link Sent To Registered Email" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong, please try again later" });
  }
});

UserRouter.post("/reset-password", async (req, res) => {
  // token is from email and newPassword is from body
  const { token } = req.query; ///??
  const { newPassword } = req.body;
  try {
    // verify the token
    let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded) {
      /// token verfied sucessfully
      /// receive new password from body and update in the DB
      console.log(decoded);
      let user = await UserModel.findById(decoded.userId);
      // user.password = newPassword; // raw password is stored, but password should be hashed and stored
      // await user.save();

      bcrypt.hash(newPassword, saltRounds, async function (err, hash) {
        if (err) {
          res.status(500).json({ message: "Something went wrong" });
        } else {
          user.password = hash; // hashed password is stored
          await user.save();
          // Blacklist the token to avoid missuse
          await BlacklistTokenModel.create({token})
         res.json({ message: "Password Reset Sucessfull" });
        }
      });
      
     
    }
    //res.json({ message: "Password Reset Sucessfull" });
  } catch (err) {
    if (err.message == "jwt expired") {
      res.status(403).json({
        message:
          "Password reset link expied, please click forget password again",
      });
    } else {
      console.log(err)
      res
        .status(500)
        .json({ message: "Something went wrong, please try again later" });
    }
  }
});
module.exports = UserRouter;
