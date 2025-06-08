const request = require("supertest"); ///
const app = require("../server");

/// Signup and Login --> Integration Test

// describe means group
describe("User Auth Tests", () => {
  /// Signup test

  test("Signup Test", async () => {
    let res = await request(app)
      .post("/users/signup")
      .send({ email: "alice@gmail.com", password: "pass123" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Signup Sucess");
  });

  test("Login Test", async () => {
    let res = await request(app)
      .post("/users/login")
      .send({ email: "alice@gmail.com", password: "pass123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Login Sucesss");
    //accessToken
     expect(res.body.accessToken).toBeDefined();
  });
});
