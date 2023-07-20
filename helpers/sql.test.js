const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError } = require('../expressError');

describe('Test for sqlForPartialUpdate function', () => {
  it('Should return correct SET clause and values', () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };
    const jsToSql = { firstName: 'first_name' };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ['Aliya', 32],
    });
  });

  it('Should return correct SET clause and values when jsToSql is not provided', () => {
    const dataToUpdate = { firstName: 'Aliya', age: 32 };

    const result = sqlForPartialUpdate(dataToUpdate,{});

    expect(result).toEqual({
      setCols: '"firstName"=$1, "age"=$2',
      values: ['Aliya', 32],
    });
  });

  it('Should throw BadRequestError if dataToUpdate is an empty object', () => {
    const dataToUpdate = {};
    const jsToSql = { firstName: 'first_name' };

    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrow(BadRequestError);
  });
});
