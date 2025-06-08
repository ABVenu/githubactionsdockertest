require("dotenv").config({
  path: process.env.NODE_ENV == "test" ? "./.env.testing" : "./.env",
});

const cors = require("cors");
const express = require("express");
const connectToDB = require("./configs/mongodb.config");
const UserRouter = require("./routes/user.routes");
const TodoRouter = require("./routes/todo.routes");
const redis = require("./configs/redis.config");

// console.log("MONGO PATH", process.env.MONGO_URI);
const PORT = process.env.PORT || 3000;
connectToDB();

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require("./swagger"); // from swagger configuartion

const app = express();

app.use(express.json());
app.use(cors()); // cors middleware

// swagger API route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// test how redis works from Nodejs
// redis.set("myKey", "Myvalue from Nodejs")
// // test getting key value pair in Nodejs
// redis.get("myKey").then((result) => {
//   console.log(result); // Prints "value"
// });


/**
 * @swagger
 * /test:
 *   get:
 *     tags: [Test]
 *     description: This is test route
 *     responses:
 *       200:
 *         description: This is test route
 *       500:
 *         description: Something went wrong
 */

app.get("/test", (req, res) => {
  try {
    res.status(200).json({ message: "This is test route" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});
/// User Router
app.use("/users", UserRouter);

//// Todo Router
app.use("/todos", TodoRouter);
// Handling undefined route
app.use((req, res) => {
  try {
    res.status(200).json({ message: "This request is undefined" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/login", (req, res) => {
  res.send("Please Login Again....");
});

// app.listen(PORT, () => {
//   console.log(`Server started and ruuning on ${PORT} port`);
// });

/// Listen to be commeneted for testing
module.exports = app;
