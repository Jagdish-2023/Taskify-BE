const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;

const authRoutes = require("./routes/auth");
const initializeDB = require("./db/db.connect");
const verifyJWT = require("./middleware/verifyJWT");
const User = require("./models/user.model");
const Todo = require("./models/todo.model");

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use("/auth", authRoutes);
initializeDB();

app.get("/", (req, res) => {
  res.send("Welcome to Taskify API");
});

app.get("/v1/user", verifyJWT, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.userId });
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch User" });
  }
});

app.get("/v1/todos", verifyJWT, async (req, res) => {
  try {
    const todos = await Todo.find({ owner: req.user.userId });

    return res.status(200).json(todos);
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: "Failed to fetch Todos" });
  }
});

app.post("/v1/todos", verifyJWT, async (req, res) => {
  const { title } = req.body;

  try {
    const newTodo = new Todo({ title, owner: req.user.userId });
    const savedTodo = await newTodo.save();

    res.status(201).json(savedTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create Todo" });
  }
});

app.listen(PORT, () => {
  console.log("server has started running..");
});
