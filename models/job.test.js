"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 130000,
    equity: "0.010",
    companyHandle: "c1",
  };

  test("works: create a new job", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(
      {
        id: job.id,
        title: "new",
        salary: 130000,
        equity: "0.010",
        companyHandle: "c1",
      },
    );

    const result = await db.query(
          `SELECT id,
          title,
          salary,
          equity,
          company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,[job.id]);
    expect(result.rows[0]).toEqual(
      {
        id: job.id,
        title: "new",
        salary: 130000,
        equity: "0.010",
        companyHandle: "c1",
      },
    );
  });

});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: "Research officer",
        salary: 134000,
        equity: "0.091",
        companyHandle: "c1",
      },
      {
        id: 2,
        title: "Careers adviser",
        salary: 57000,
        equity: "0.051",
        companyHandle: "c1",
      },
      {
        id: 3,
        title: "IT consultant",
        salary: 120000,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works : get a job by id", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
        id: job.id,
        title: "Research officer",
        salary: 134000,
        equity: "0.091",
        companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(5);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "Financial planner",
    salary: 114000,
    equity: "0.091",
  };



  test("works: update a job", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: job.id,
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
            FROM jobs
            WHERE id = ${job.id}`);
    expect(result.rows).toEqual([{
        id: job.id,
        companyHandle: "c1",
        ...updateData,
      }]);
  });


  test("not found if no such job", async function () {
    try {
      await Job.update(5, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works: delete a job", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(28);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findBy method */

  describe('findBy method', () => {
    test('should return all jobs when no filters are provided', async () => {

        const result = await Job.findBy({});
        expect(result).toEqual([
            {
              id: 1,
              title: "Research officer",
              salary: 134000,
              equity: "0.091",
              companyHandle: "c1",
            },
            {
              id: 2,
              title: "Careers adviser",
              salary: 57000,
              equity: "0.051",
              companyHandle: "c1",
            },
            {
              id: 3,
              title: "IT consultant",
              salary: 120000,
              equity: "0",
              companyHandle: "c1",
            },
        ]);

        const queryCheck = await db.query(
          `SELECT id,title,salary,equity,
           company_handle AS "companyHandle"
           FROM jobs`);
   
        expect(queryCheck.rows).toEqual([
          {
            id: 1,
            title: "Research officer",
            salary: 134000,
            equity: "0.091",
            companyHandle: "c1",
          },
          {
            id: 2,
            title: "Careers adviser",
            salary: 57000,
            equity: "0.051",
            companyHandle: "c1",
          },
          {
            id: 3,
            title: "IT consultant",
            salary: 120000,
            equity: "0",
            companyHandle: "c1",
          },
      ]);


    });

    test('Should filter jobs by title if provided', async () => {
      const expectedResult = [
        {
          id: 1,
          title: "Research officer",
          salary: 134000,
          equity: "0.091",
          companyHandle: "c1",
        }
    ];
      const title = "Research officer";
      const result = await Job.findBy({ title });
      expect(result).toEqual(expectedResult);
    });

    test('Should filter jobs by minSalary if it is provided', async () => {
      const minSalary = 120000;
      const result = await Job.findBy({ minSalary });
      expect(result).toEqual([
        {
          id: 1,
          title: "Research officer",
          salary: 134000,
          equity: "0.091",
          companyHandle: "c1",
        },
        {
          id: 3,
          title: "IT consultant",
          salary: 120000,
          equity: "0",
          companyHandle: "c1",
      }
      ]);
    });

    test('Should filter jobs by hasEquity if it is provided', async () => {
      const hasEquity = true;
      const result = await Job.findBy({ hasEquity });
      expect(result).toEqual([
        {
          id: 1,
          title: "Research officer",
          salary: 134000,
          equity: "0.091",
          companyHandle: "c1",
        },
        {
          id: 2,
          title: "Careers adviser",
          salary: 57000,
          equity: "0.051",
          companyHandle: "c1",
        },
      ]);
    });
    
    test('Should filter jobs by all parameters title, minSalary and hasEquity if they are provided', async () => {
      const title = "Research officer";
      const minSalary = 134000;
      const hasEquity = false;
      const result = await Job.findBy({ title, minSalary, hasEquity});
      expect(result).toEqual([
        {
          id: 1,
          title: "Research officer",
          salary: 134000,
          equity: "0.091",
          companyHandle: "c1",
        }
      ]);
    });

  });