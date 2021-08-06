"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  adminToken,
  nonAdminToken,
  testJobs
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    companyHandle: "c1",
    title: "newJob",
    salary: 100,
    equity: "0.1",
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        companyHandle: "c1",
        title: "newJob",
        salary: 100,
        equity: "0.1",
        id: expect.any(Number)
      },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          companyHandle: "c1"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: "notValid",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
  
  test("fail for non admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${nonAdminToken}`);
    expect(resp.statusCode).toEqual(403);
    expect(resp.body).toEqual({
      error: {
        message: "Bad Request, Forbidden",
        status: 403
      }
    });
  });
  
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: testJobs,
    });
  });
  
  test("query for title", async function () {
    const resp = await request(app).get("/jobs?title=job1");
    expect(resp.body).toEqual({
      jobs:
        [testJobs[0]],
    });
  });
  
  test("query for minimum salary", async function () {
    const resp = await request(app).get("/jobs?minSalary=150");
    expect(resp.body).toEqual({
      jobs:
        [testJobs[1],testJobs[2]],
    });
  });
    
  test("query for hasEquity", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
        [testJobs[0],testJobs[2]],
    });
  });
  
  test("query for companyHandle", async function () {
    const resp = await request(app).get("/jobs?companyHandle=c2");
    expect(resp.body).toEqual({
      jobs:
        [testJobs[1]],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobs[0].id}`);
    expect(resp.body).toEqual({
      job: testJobs[0],
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobs[0].id}`)
        .send({
          title: "jobUpdated",
          equity:"0.8",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobs[0].id,
        title:"jobUpdated",
        salary:testJobs[0].salary,
        equity:"0.8",
        companyHandle: testJobs[0].companyHandle,
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/c1`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/c1`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/c1`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
  
  test("fails for nonAdmin", async function () {
    const resp = await request(app)
        .patch(`/jobs/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${nonAdminToken}`);
    expect(resp.statusCode).toEqual(403);
    expect(resp.body).toEqual({
      error: {
        message: "Bad Request, Forbidden",
        status: 403
      }
    });
  });
  
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobs[0].id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${testJobs[0].id}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
  
  test("fails for non admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/c1`)
        .set("authorization", `Bearer ${nonAdminToken}`);
    expect(resp.statusCode).toEqual(403);
    expect(resp.body).toEqual({
      error: {
        message: "Bad Request, Forbidden",
        status: 403
      }
    });
  });
  
});
