const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// ✅ MongoDB Model
const Todo = require("./models/Todo");

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Docker-Compatible MongoDB Connection
mongoose.connect("mongodb://mongo:27017/todo-list")


  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Routes

app.get("/will", (req, res) => {
  res.json({ response: "Hello World" });
});

// Get all todos
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new todo
app.post("/api/todos", async (req, res) => {
  try {
    const { text, dueDate } = req.body;
    const newTodo = new Todo({ text, dueDate, completed: false });
    await newTodo.save();
    res.json(newTodo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update todo
app.put("/api/todos/:id", async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete todo
app.delete("/api/todos/:id", async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Start server
module.exports = app;

if (require.main === module) {
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
}
