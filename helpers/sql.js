const { BadRequestError } = require("../expressError");


/* 
  takes in an object representing data in the database(dataToUpdate) 
  and an object representing which columns of data they represent(jsToSql)
  
  returns an object with "setCols" being a string to be used in an SQL UPDATE query for which columns to set; "values" is an array of the values to be updated in the where clause
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
// console.log(cols);
// console.log(Object.values(dataToUpdate));
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
