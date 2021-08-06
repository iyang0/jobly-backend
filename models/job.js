"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/* Our database uses the NUMERIC field type. Do some research on why we chose this, rather than a FLOAT type. Discover what the pg library returns when that field type is queried, and form a theory on why. Be prepared to discuss this during code reviews. 

>console.log(typeof(jobsRes.rows[0].equity));
>>string

Numeric is used for things that require precision, and equity of a company can be subdivided a lot(e.g. millions of shares between people). There is no data type equivalent in vanilla javascript that can give the precision that SQL's numeric type gives so it is represented by a string instead.
*/

/** 
  Functions for Jobs, 
  jobs table related many to one to companies table. 
*/

class Job {
    
  /** 
  makes a job taking in an object as input,
  updates the database,
  returns the new job data.
  
  
  input data shape:
  { title, salary, equity, companyHandle }
  
  Returns:
  { id, title, salary, equity, companyHandle }
   **/
  static async create({ title, salary, equity, companyHandle }) {
    
    const result = await db.query(
          `INSERT INTO jobs (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle,
        ]);
        
    let job = result.rows[0];

    return job;
  }

  /** 
  Finds all jobs or all jobs that fit a search filter,
  searchFilter is an object(filterBy) that filters for
  - minSalary
  - hasEquity (boolean; true for jobs with equity > 0)
  - title (string; case-insensitive, partial matches)
  - company (string; case-insensitive, partial matches)
  
  Returns an array of jobs:
  [{ id, title, salary, equity, companyHandle }, ...]
   * */
  static async findAll(filterBy) {
    
    let whereClause = "";
    let whereValues = [];
    if(filterBy instanceof Object && Object.keys(filterBy).length > 0){
      let { minSalary, hasEquity, title, companyHandle } = filterBy;
      
      let whereStatement = Job._sqlWhereBuilder(
          minSalary,
          hasEquity,
          title,
          companyHandle);
      
      whereClause = whereStatement.whereClause;
      whereValues = whereStatement.whereValues;
    }
    
    
    let query = `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle AS "companyHandle"
                FROM jobs
                ${whereClause}
                ORDER BY title`;

    const jobsResults = await db.query(query, whereValues);
    return jobsResults.rows;
  }
  
  /* 
    helper function for searching for jobs that builds a where clause
    based on what to filter by.
  */
  static _sqlWhereBuilder(minSalary, hasEquity, title, companyHandle){
    // For each possible search term, add to whereClause and
    // whereValues so we can generate the right SQL

    let whereClause = [];
    let whereValues = [];

    if (minSalary !== undefined) {
      whereValues.push(minSalary);
      whereClause.push(`salary >= $${whereValues.length}`);
    }

    if (hasEquity === true) {
      whereClause.push(`equity > 0`);
    }

    if (title !== undefined) {
      whereValues.push(`%${title}%`);
      whereClause.push(`title ILIKE $${whereValues.length}`);
    }
    
    //not asked for, but I want this for the "Show Jobs for a Company" part
    if (companyHandle !== undefined) {
      whereValues.push(`%${companyHandle}%`);
      whereClause.push(`company_handle ILIKE $${whereValues.length}`);
    }
    
    whereClause = "WHERE "+ whereClause.join(" AND ")
    
    return {
        whereClause,
        whereValues
    };
    
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`There is no job with id: ${id}`);

    // const companiesResults = Company.get(job.companyHandle);
    // job.company = companiesResults.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    //title, salary, and equity already same name as SQL column
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs 
      SET ${setCols} 
      WHERE id = ${idVarIdx} 
      RETURNING id, 
                title, 
                salary, 
                equity,
                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];
    // console.log(job)
    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;