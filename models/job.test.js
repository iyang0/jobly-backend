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
    let jobs = await Job.findAll({title: "';SELECT * FROM jobs;"});
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
      expect(err instanceof DatabaseError).toBeTruthy();
    }
  });
  
  test("not found if no such Job", async function () {
    try {
      await Job.get(0);
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
    let job = await Job.update(testJobs[0].id, updateData);
    expect(job).toEqual({
      id: testJobs[0].id,
      companyHandle: testJobs[0].companyHandle,
      ...updateData,
    });

    const result = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${testJobs[0].id}`);
    expect(result.rows).toEqual([{
      id: testJobs[0].id,
      companyHandle: testJobs[0].companyHandle,
      title: "JobUpdate",
      salary: 10000,
      equity: "0.3",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataNull = {
      title: "JobUpdate2",
      salary: 15000,
      equity: null,
    };

    let job = await Job.update(testJobs[0].id, updateDataNull);
    expect(job).toEqual({
      id: testJobs[0].id,
      companyHandle: testJobs[0].companyHandle,
      ...updateDataNull,
    });

    const result = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${testJobs[0].id}`);
    expect(result.rows).toEqual([{
      id: testJobs[0].id,
      companyHandle: testJobs[0].companyHandle,
      title: "JobUpdate2",
      salary: 15000,
      equity: null,
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  
  test("db error if string", async function () {
    try {
      await Job.update("two", updateData);
      fail();
    } catch (err) {
      // console.log(err.constructor.name)
      expect(err instanceof DatabaseError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(testJobs[0].id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobs[0].id);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${testJobs[0].id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("DatabaseError if access job Id with string", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof DatabaseError).toBeTruthy();
    }
  });
  
  test("not found if job Id doesn't exist", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  
});
