"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { DatabaseError } = require("pg-protocol")
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobs
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);



/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New",
    equity: "0.5",
    salary: 50,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      title: newJob.title,
      equity: newJob.equity,
      salary: newJob.salary,
      companyHandle: newJob.companyHandle,
      id: expect.any(Number),
    });
  });

});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual(testJobs);
  });
});

/************************************** findAll with filters */

describe("findAll with filters", function () {
    
  test("filter by title", async function () {
    let jobs = await Job.findAll({title : "Job1"});
    expect(jobs).toEqual([testJobs[0]]);
  });
  
  test("filter by min salary", async function () {
    let jobs = await Job.findAll({minSalary : 150});
    expect(jobs).toEqual([testJobs[1], testJobs[2]]);
  });
  
  test("filter by if job offers equity", async function () {
    let jobs = await Job.findAll({hasEquity : true});
    expect(jobs).toEqual([testJobs[0], testJobs[2]]);
  });
  
  test("filter by company handle", async function () {
    let jobs = await Job.findAll({companyHandle : "c1"});
    expect(jobs).toEqual([testJobs[0], testJobs[2]]);
  });
  
  test("Cannot SQL inject", async function () {
    let jobs = await Job.findAll({title: ";SELECT * FROM companies;"});
    expect(jobs).toEqual([]);
  });
  
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testJobs[0].id);
    expect(job).toEqual(testJobs[0]);
  });

  test("DatabaseError if non number string", async function () {
    try {
      await Job.get("twenty");
      fail();
    } catch (err) {
        console.log(err.constructor.name);
      expect(err instanceof DatabaseError).toBeTruthy();
    }
  });
  
  test("not found if no such Job", async function () {
    try {
      await Job.get(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "JobUpdate",
    salary: 10000,
    equity: "0.3",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  // test("works: null fields", async function () {
    // const updateDataSetNulls = {
      // name: "New",
      // description: "New Description",
      // numEmployees: null,
      // logoUrl: null,
    // };

    // let company = await Company.update("c1", updateDataSetNulls);
    // expect(company).toEqual({
      // handle: "c1",
      // ...updateDataSetNulls,
    // });

    // const result = await db.query(
          // `SELECT handle, name, description, num_employees, logo_url
           // FROM companies
           // WHERE handle = 'c1'`);
    // expect(result.rows).toEqual([{
      // handle: "c1",
      // name: "New",
      // description: "New Description",
      // num_employees: null,
      // logo_url: null,
    // }]);
  // });

  // test("not found if no such company", async function () {
    // try {
      // await Company.update("nope", updateData);
      // fail();
    // } catch (err) {
      // expect(err instanceof NotFoundError).toBeTruthy();
    // }
  // });

  // test("bad request with no data", async function () {
    // try {
      // await Company.update("c1", {});
      // fail();
    // } catch (err) {
      // expect(err instanceof BadRequestError).toBeTruthy();
    // }
  // });
});

/************************************** remove */

// describe("remove", function () {
  // test("works", async function () {
    // await Company.remove("c1");
    // const res = await db.query(
        // "SELECT handle FROM companies WHERE handle='c1'");
    // expect(res.rows.length).toEqual(0);
  // });

  // test("not found if no such company", async function () {
    // try {
      // await Company.remove("nope");
      // fail();
    // } catch (err) {
      // expect(err instanceof NotFoundError).toBeTruthy();
    // }
  // });
// });
