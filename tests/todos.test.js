const request = require("supertest"); ///
const app = require("../server");

/// Test the protected Routes
/// To test protected routes, we need login and get the token
/// write login test, store the token in global variable and then test
// the protected routes by passsing token in headers

describe("Todos Routes Test", () => {
  let token;

  test("Register User", async () => {
    await request(app)
      .post("/users/signup")
      .send({ email: "bob@gmail.com", password: "pass123" });
  });

  test("Login User", async () => {
    let res = await request(app)
      .post("/users/login")
      .send({ email: "bob@gmail.com", password: "pass123" });
    //console.log("token", res.body.accessToken)
    token = res.body.accessToken;
  });

  test("Add Todo", async () => {
    //console.log("token in add todo route", token)

    let res = await request(app)
      .post("/todos/add-todo")
      .set({ authorization: `bearer ${token}` })
      .send({title:"This is todo from testing"});
      expect(res.statusCode).toBe(201);
      expect(res.body.todo.title).toBe("This is todo from testing")
      //console.log("response", res.body.todo)
  });
});
