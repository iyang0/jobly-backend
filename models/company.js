"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const Job = require("./job")

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
        `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
        `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies that match by the filter condition, 
   * if no filter condition gets all compnaies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filterBy) {
    
    let whereClause = "";
    let whereValues = [];
    if(filterBy instanceof Object && Object.keys(filterBy).length > 0){
      let { minEmp, maxEmp, name } = filterBy;
      
      let whereStatement = Company._sqlWhereBuilder(name, minEmp, maxEmp);
      
      whereClause = whereStatement.whereClause;
      whereValues = whereStatement.whereValues;
    }
    
    const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ${whereClause}
           ORDER BY name`,
           whereValues);
           
    return companiesRes.rows;
    
  }
  
  /* 
    helper function for earching for companies that builds a where clause
    based on what to filter by.
  */
  static _sqlWhereBuilder(name, min, max){
    
    let whereClause = [];
    let whereValues = [];
    
    // need to do the values separately otherwise no SQL injection protection
    // if(name !== undefined) whereClause.push(`name ILIKE '%${name}%'`);
    if(name !== undefined) {
      whereValues.push(`%${name}%`);
      whereClause.push(`name ILIKE $${whereValues.length}`);
      // whereValues.push(name)
      // whereClause.push(`name ILIKE '%$${whereValues.length}%'`);
    }
    
    if (min !== undefined) {
      whereValues.push(min);
      whereClause.push(`num_employees >= $${whereValues.length}`);
    }
    
    if (max !== undefined) {
      whereValues.push(max);
      whereClause.push(`num_employees <= $${whereValues.length}`);
    }
    
    
    whereClause = "WHERE "+ whereClause.join(" AND ")
    return {
        whereClause,
        whereValues
    };

  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);
    
    const company = companyRes.rows[0];

    const jobs = Job.findAll({ companyHandle : handle });
    
    company["jobs"] = jobs;

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
      WHERE handle = ${handleVarIdx}
      RETURNING handle, 
        name,
        description,
        num_employees AS "numEmployees",
        logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
        `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
