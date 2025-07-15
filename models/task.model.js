const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    todo: { type: mongoose.Schema.Types.ObjectId, ref: "Todo", required: true },
    status: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
