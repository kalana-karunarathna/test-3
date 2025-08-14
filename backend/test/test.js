const request = require("supertest");
const app = require("../index.js"); // adjust path if needed

describe("API Tests", function () {

  // ✅ Test /will route
  it("GET /will → should respond with Hello World", function (done) {
    request(app)
      .get("/will")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect({ response: "Hello World" })
      .end(done);
  });

  // ✅ Test get all todos
  it("GET /api/todos → should return an array", function (done) {
    request(app)
      .get("/api/todos")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect(res => {
        if (!Array.isArray(res.body)) {
          throw new Error("Response is not an array");
        }
      })
      .end(done);
  });

  // ✅ Test create todo
  it("POST /api/todos → should create a todo", function (done) {
    request(app)
      .post("/api/todos")
      .send({ text: "Test Todo", dueDate: "2025-08-14" })
      .expect("Content-Type", /json/)
      .expect(200)
      .expect(res => {
        if (!res.body._id) throw new Error("Todo was not created");
      })
      .end(done);
  });

  // ✅ Test update todo
  it("PUT /api/todos/:id → should update a todo", function (done) {
    // First, create a todo
    request(app)
      .post("/api/todos")
      .send({ text: "Update Me", dueDate: "2025-08-14" })
      .end((err, res) => {
        if (err) return done(err);
        const id = res.body._id;

        request(app)
          .put(`/api/todos/${id}`)
          .send({ completed: true })
          .expect(200)
          .expect(res => {
            if (!res.body.completed) throw new Error("Todo was not updated");
          })
          .end(done);
      });
  });

  // ✅ Test delete todo
  it("DELETE /api/todos/:id → should delete a todo", function (done) {
    // First, create a todo
    request(app)
      .post("/api/todos")
      .send({ text: "Delete Me", dueDate: "2025-08-14" })
      .end((err, res) => {
        if (err) return done(err);
        const id = res.body._id;

        request(app)
          .delete(`/api/todos/${id}`)
          .expect(200)
          .expect({ success: true })
          .end(done);
      });
  });
});
