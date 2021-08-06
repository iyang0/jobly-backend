"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * company should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login, isAdmin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, jobNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [{ id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity
 * - title (will find case-insensitive, partial matches)
 * - companyHandle (case-insensitive, partial matches)
 *
 * If min is greater than max in query, throw bad request
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  
  const {
    minSalary,
    hasEquity,
    title, 
    companyHandle 
    } = req.query;
  let jobs;
  
  if( minSalary === undefined 
      && hasEquity === undefined
      && title === undefined
      && companyHandle === undefined){
    jobs = await Job.findAll();
  }else{
    jobs = await Job.findAll({minSalary, hasEquity, title, companyHandle});
  }
  
  return res.json({ jobs });
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login, isAdmin
 */

router.patch("/:id", 
    ensureLoggedIn, 
    ensureAdmin, 
    async function (req, res, next) {
        
  const validator = jsonschema.validate(req.body, jobUpdateSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.id, req.body);
  return res.json({ job });
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login, isAdmin
 */

router.delete("/:id", 
    ensureLoggedIn, 
    ensureAdmin, 
    async function (req, res, next) {
        
  await Job.remove(req.params.id);
  return res.json({ deleted: req.params.id });
});


module.exports = router;
