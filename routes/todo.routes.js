const express = require("express");
const TodoModel = require("../models/todo.model");
const authMiddleware = require("../middlewares/auth.middleware");
//const redis = require("../configs/redis.config");
const cron = require("node-cron");
const TodoRouter = express.Router();
const PDFDocument = require("pdfkit");
const fs = require("fs");
const nodemailer = require("nodemailer");

/// Routes will decided role to be allowed

/**
 * @swagger
 * /todos/add-todo:
 *   post:
 *     summary: Add a new todo
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Buy groceries"
 *               status:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Todo added successfully
 *       500:
 *         description: Server error
 */

TodoRouter.post(
  "/add-todo",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      let userId = req.user;
      let todo = await TodoModel.create({ ...req.body, userId: req.user });
      /// Delete the existing Todos is Redis,
      // so that new Todo should be included get todo resposne
      //redis.del(userId);
      res.status(201).json({ message: "Todo Added", todo });
    } catch (err) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

TodoRouter.delete(
  "/delete-todo/:id",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
       let userId = req.user;
      const { id } = req.params;
      await TodoModel.findByIdAndDelete(id);
       /// Delete the existing Todos is Redis,
      // so that new Todo should be included get todo resposne
      //redis.del(userId);
      res.status(200).json({ message: "Todo Deleted" });
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: "Error in Deleting Todo" });
    }
  }
);

TodoRouter.patch(
  "/update-todo/:id",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
       let userId = req.user;
      const { id } = req.params;
      await TodoModel.findByIdAndUpdate(id, req.body);
       /// Delete the existing Todos is Redis,
      // so that new Todo should be included get todo resposne
      //redis.del(userId);
      res.status(200).json({ message: "Todo Updated" });
    } catch (err) {
      console.log(err)
      res.status(500).json({ message: "Error in Updating Todo" });
    }
  }
);
/// Caching is applied to this route
/**
 * @swagger
 * /todos/alltodos:
 *   get:
 *     summary: Getting Logged In User's Todo
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todos List
 *       500:
 *         description: Server error
 */
TodoRouter.get(
  "/alltodos",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      /// check data is present in Redis,
      // if yes, send the response with Redis Data
      /// if no, get data form DB, store in Redis and send a response

      // Uses Key Value,
      // Key should be used? allTodos??
      let userId = req.user;
      let cachedData = await redis.get(userId);
      console.log("cachedData", cachedData)

      if (!cachedData) {
        /// data is not stored in Redis
        // get Data from DB and store in Redis and give the response
        let todos = await TodoModel.find({ userId: req.user });
        // storing in redis, stringify the data before storing
        //redis.set(userId, JSON.stringify(todos), "EX", 300);
        res.status(200).json({ message: "Todos List From DB", todos });
      } else {
        // Data is present in the Redis, send this as respsonse
        let todos = JSON.parse(cachedData);
        res
          .status(200)
          .json({ message: "Todos List From Redis-Caching", todos });
      }
      // let todos = JSON.parse(cachedData);
      // let todos = await TodoModel.find({ userId: req.user });
      //   res
      //     .status(200)
      //     .json({ message: "Todos List From Redis-Caching", todos });
    } catch (err) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

/// Implementation/ Integration of Utility Modules,
// which provides a service of Bulk Adding the todos then after seding the report to user's email
/// MedicalLab, Blood, Test It --> Update Results in DB
/// Cron will be running at every two hours, for test completed patients report will be sent to email
/// Adhar Upadtions will be reflecting after 8 days??
/// Let us assume  2cr people updates Aadhar per day
// we cannot run DB updation for every user,
/// Store the updation in Cache, Give Acknowldgement to user
/// Run a Cron which updates the users changes in batch wise

/// Bulk Updatiopn service

TodoRouter.post(
  "/bulk-add-todos",
  authMiddleware(["user", "admin"]),
  async (req, res) => {
    /// User will give array of todos
    /// store in Redis and proide the response
    /// Let Cron Runs at every 10 mins, which uploads Todos in DB and finally sends the email
    let userId = req.user;
    let todos = req.body; // Array of Todos
    todos.push(userId);

    redis.set("BulTodoUpdate", JSON.stringify(todos));
    res.status(200).json({
      message:
        "Task Is Scheduled, Will Receive report in email, once it is finished",
    });
  }
);

///run a cron which pushes Todos into DB and sends Mail
cron.schedule("*/10 * * * * *", async () => {
  let todos = await redis.get("BulTodoUpdate");
  if (todos) {
    todos = JSON.parse(todos);
    let userId = todos[todos.length - 1]; // last element in todos array
    todos.pop();
    let passedTodo = 0;
    let failedTodo = 0;
    for (let todo of todos) {
      try {
        await TodoModel.create({ ...todo, userId });
        passedTodo++;
      } catch (err) {
        failedTodo++;
      }
    }

    let report = `Bulk Todo Update Report:
  Task Inititated By: ${userId}
  Passed Todos are: ${passedTodo}
  Failed Todos are: ${failedTodo}`;

    console.log(report);
    /// Generating Report
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(`./reports/${userId}.pdf`));
    doc.fontSize(25).text(report, 100, 100);
    doc.end();

    redis.del("BulTodoUpdate");
    // once pdf genrated, send the pdf to the user's email

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
    const info = await transporter.sendMail({
      from: '"Venugopal Burli" <venugopal@gmail.com>',
      to: "venugopal.burli@masaischool.com",
      subject: "This is test email sent",
      text: "Bulk Todo Report", // plain‑text body
      attachments: [
        {
          filename: "Report.pdf",
          path: `./reports/${userId}.pdf`,
        },
      ],
    });
    console.log("Cron finished");
  } else {
    console.log("No Todos Found To Update Bulk");
  }
});

module.exports = TodoRouter;
