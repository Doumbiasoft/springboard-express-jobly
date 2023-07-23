"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

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
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
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

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

    /** Find companies by { minEmployees, maxEmployees, name } if provided otherwise get all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

    static async findBy({ minEmployees, maxEmployees, name }) {

      const paramsValue =[];
      let filter = "";
      let current_number = 0;
      let query = `SELECT handle, name, description, num_employees AS "numEmployees",logo_url AS "logoUrl" FROM companies `;

      if(minEmployees && maxEmployees){
        if(minEmployees > maxEmployees){
          throw new BadRequestError(`minEmployees "${minEmployees}" value should be lower than maxEmployees "${maxEmployees}" value`);
        }
      }
      if(minEmployees){
        if (filter.trim() !== ""){
          filter += `AND `;
        }
        current_number++;
        filter += `num_employees >=$${current_number} `;
        paramsValue.push(minEmployees);
      }
      if(maxEmployees){
        if (filter.trim() !== ""){
          filter += `AND `;
        }
        current_number++;
        filter += `num_employees <=$${current_number} `;
        paramsValue.push(maxEmployees);
      }
      //----------------------where-------------------------------
      if (filter.trim() !== "")
        {
          if(name){
            current_number++;
            query += `WHERE name
            ILIKE '' || $${current_number} || '%'
            OR name ILIKE '%' || $${current_number} || ''
            OR name ILIKE '%' || $${current_number} || '%'
            AND ` + filter;
            paramsValue.push(name);

          }else{
            query += `WHERE ` + filter;
          }
        }
        else
        {
          if(name){
            current_number++;
            query += `WHERE name
            ILIKE '' || $${current_number} || '%'
            OR name ILIKE '%' || $${current_number} || ''
            OR name ILIKE '%' || $${current_number} || '%' `;
            paramsValue.push(name);
          }
        }
      //------------------------end where-------------------------------
      const companiesRes = await db.query(query, [...paramsValue]);
      return companiesRes.rows;
    }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes =  db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

        const jobRes =  db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE company_handle = $1`,
        [handle]);

        let promises = await Promise.all([companyRes,jobRes]);

        if(promises[0].rows.length === 0){
            throw new NotFoundError('No company',404);
        }


    //const company = companyRes.rows[0];
    const company = {
        handle:  promises[0].rows[0].handle,
        name: promises[0].rows[0].name,
        description: promises[0].rows[0].description,
        numEmployees: promises[0].rows[0].numEmployees,
        logoUrl: promises[0].rows[0].logoUrl,
        jobs : promises[1].rows
  };

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

    const querySql = `UPDATE companies 
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
