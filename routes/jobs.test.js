"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u1TokenAdmin,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 130000,
        equity: "0.010",
        companyHandle: "c1",
      };

  test("ok for users admin: add un new job", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: { id:4, ...newJob},
    });
  });

  test("bad request with missing data for adding a job", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new",
            salary: 130000,
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data: salary not an integer", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new",
            salary: "130000",
            equity: "0.010",
            companyHandle: "c1",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon any one", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
        jobs:
          [
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
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon: any one", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "Research officer",
        salary: 134000,
        equity: "0.091",
        companyHandle: "c1",
      },
    });
  });


  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/6`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for users admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          title: "Research officer-new-title",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "Research officer-new-title",
        salary: 134000,
        equity: "0.091",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon for a user non admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
            title: "Research officer-new-title",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/7`)
        .send({
            title: "Research officer-new-title",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
            companyHandle: "c3",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
        expect(resp.statusCode).toEqual(400);
  });
  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
            id: 8,
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
        expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
          salary: "not-a-url",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/3`)
        .set("authorization", `Bearer ${u1TokenAdmin}`);
        expect(resp.body).toEqual({ deleted: "3" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/3`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not foun for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/8`)
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** TEST route jobs by filtering */

describe('Request filtering Jobs.findBy', () => {

  it('Should return all jobs if no parameters are provided', async () => {
    const resp = await request(app).get('/jobs')
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
        jobs:
          [
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
          ],
    });
  });

  test('Should return jobs with minSalary greater than or equal to salary if minSalary is provided', async () => {
    const minSalary = 134000;
    const resp = await request(app).get(`/jobs?minSalary=${minSalary}`)
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
        jobs:[
        {
            id: 1,
            title: "Research officer",
            salary: 134000,
            equity: "0.091",
            companyHandle: "c1",
        },
       ]
    });

  });

  test('Should return jobs with hasEquity if hasEquity is provided', async () => {
    const hasEquity = false;
    const resp = await request(app).get(`/jobs?hasEquity=${hasEquity}`)
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      jobs:[
        {
          id: 1,
          title: 'Research officer',
          salary: 134000,
          equity: '0.091',
          companyHandle: 'c1'
        },
        {
          id: 2,
          title: 'Careers adviser',
          salary: 57000,
          equity: '0.051',
          companyHandle: 'c1'
        },
        {
          id: 3,
          title: 'IT consultant',
          salary: 120000,
          equity: '0',
          companyHandle: 'c1'
        }
       ]
    });

  });

  test('Should return jobs whose title matches the provided title parameter', async () => {
    const title = 'Careers adviser';
    const resp = await request(app).get(`/jobs?title=${title}`);
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      jobs:[
        {
            id: 2,
            title: 'Careers adviser',
            salary: 57000,
            equity: '0.051',
            companyHandle: 'c1'
          },
       ]
    });
  });

  
});
