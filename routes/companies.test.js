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

describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("ok for users", async function () {
    const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCompany,
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /companies", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies:
          [
            {
              handle: "c1",
              name: "C1",
              description: "Desc1",
              numEmployees: 1,
              logoUrl: "http://c1.img",
            },
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img",
            },
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              numEmployees: 3,
              logoUrl: "http://c3.img",
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
        .get("/companies")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
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
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        jobs:[],
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/companies/nope`)
        .send({
          name: "new nope",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${u1TokenAdmin}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** TEST route companies by filtering */

describe('Request filtering Company.findBy', () => {

  test('Should return all companies if no parameters are provided', async () => {
    const resp = await request(app).get('/companies')
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      companies:[
        {
          handle: "c1",
          name: "C1",
          numEmployees: 1,
          description: "Desc1",
          logoUrl: "http://c1.img",
        },
        {
          handle: "c2",
          name: "C2",
          numEmployees: 2,
          description: "Desc2",
          logoUrl: "http://c2.img",
        },
          {
            handle: "c3",
            name: "C3",
            numEmployees: 3,
            description: "Desc3",
            logoUrl: "http://c3.img",
          },
       ]
    });
  });

  test('Should return companies with numEmployees greater than or equal to minEmployees if minEmployees parameter is provided', async () => {
    const minEmployees = 3;
    const resp = await request(app).get(`/companies?minEmployees=${minEmployees}`)
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      companies:[
          {
            handle: "c3",
            name: "C3",
            numEmployees: 3,
            description: "Desc3",
            logoUrl: "http://c3.img",
          },
       ]
    });

  });

  test('Should return companies with numEmployees less than or equal to maxEmployees if maxEmployees parameter is provided', async () => {
    const maxEmployees = 1;
    const resp = await request(app).get(`/companies?maxEmployees=${maxEmployees}`)
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      companies:[
          {
          handle: "c1",
          name: "C1",
          numEmployees: 1,
          description: "Desc1",
          logoUrl: "http://c1.img",
          },
       ]
    });

  });

  test('Should return companies with numEmployees between minEmployees and maxEmployees if both parameters are provided', async () => {
    const minEmployees = 2;
    const maxEmployees = 3;
    const resp = await request(app).get(`/companies?minEmployees=${minEmployees}&maxEmployees=${maxEmployees}`)
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      companies:[
        {
          handle: "c2",
          name: "C2",
          numEmployees: 2,
          description: "Desc2",
          logoUrl: "http://c2.img",
        },
          {
            handle: "c3",
            name: "C3",
            numEmployees: 3,
            description: "Desc3",
            logoUrl: "http://c3.img",
          },
       ]
    });
  });

  test('Should return companies whose name matches the provided name parameter', async () => {
    const name = 'C1';
    const resp = await request(app).get(`/companies?name=${name}`);
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({
      companies:[
          {
          handle: "c1",
          name: "C1",
          numEmployees: 1,
          description: "Desc1",
          logoUrl: "http://c1.img",
          },
       ]
    });
  });

  test('should throw a BadRequestError when minEmployees is greater than maxEmployees', async () => {
    const minEmployees = 3;
    const maxEmployees = 1;
    const resp = await request(app).get(`/companies?minEmployees=${minEmployees}&maxEmployees=${maxEmployees}`);
    expect(resp.status).toBe(400);
    expect(resp.body).toEqual({
      error:
          {
            message: "minEmployees \"3\" value should be lower than maxEmployees \"1\" value",
            status: 400
          }
       });
  });
});
