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
const Task = require("./models/task.model");

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

app.get("/v1/todos/:todoId", verifyJWT, async (req, res) => {
  const todoId = req.params.todoId;
  try {
    const todoInfo = await Todo.findOne({
      owner: req.user.userId,
      _id: todoId,
    }).select("-owner");
    if (!todoInfo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    const tasks = await Task.find({ todo: todoInfo._id });

    return res.status(200).json({ todo: { todo: todoInfo, tasks } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get Todo" });
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

app.post("/v1/todo/tasks", verifyJWT, async (req, res) => {
  const { title, status, todoId } = req.body;
  try {
    if (!title || !status || !todoId) {
      return res
        .status(400)
        .json({ error: "Task title, status and todo id are required" });
    }

    const newTask = new Task({
      title,
      status,
      owner: req.user.userId,
      todo: todoId,
    });
    const savedTask = await newTask.save();
    return res.status(201).json(savedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add task" });
  }
});

app.post("/v1/todo/tasks/:taskId/status", verifyJWT, async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    if (!status || !taskId) {
      return res.status(400).json({ error: "Task status and id are required" });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, owner: req.user.userId },
      { status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task status updated", updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

app.delete("/v1/todo/tasks/:taskId", verifyJWT, async (req, res) => {
  const taskId = req.params.taskId;
  try {
    const deletedTask = await Task.findOneAndDelete({
      owner: req.user.userId,
      _id: taskId,
    });
    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json(deletedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete Task" });
  }
});

app.delete("/v1/todos/:todoId", verifyJWT, async (req, res) => {
  const todoId = req.params.todoId;
  try {
    const deleteTodo = await Todo.findOneAndDelete({
      owner: req.user.userId,
      _id: todoId,
    });
    if (!deleteTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    await Task.deleteMany({
      owner: req.user.userId,
      todo: todoId,
    });

    return res.status(200).json(deleteTodo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete Todo" });
  }
});

app.listen(PORT, () => {
  console.log("server has started running..");
});
