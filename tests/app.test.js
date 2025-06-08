const request = require('supertest'); /// 
const app = require('../server');


test("First API Test", async ()=>{
    let res = await request(app).get("/test");
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe("This is test route")
})