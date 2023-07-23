const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

function sqlQuerySearchKeyWords(searchKeyWords) {
  const keys = Object.keys(searchKeyWords);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {first_name: 'Aliya', age: 32} => ['"first_name" ILIKE '' || $1 || '%'', '"age" ILIKE '' || $2 || '%''']
  const cols = keys.map((colName, idx) =>
      `"${colName}" ILIKE '' || $${idx + 1} || '%'`,
  );

  return {
    setCols: cols.join(" OR "),
    values: Object.values(searchKeyWords),
  };
}

module.exports = { sqlForPartialUpdate };
