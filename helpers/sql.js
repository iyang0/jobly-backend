const { BadRequestError } = require("../expressError");


/* 
  Helper function for making update queries.
  Takes in an object representing data in the database(dataToUpdate)
    {key1: newValue, key2: newValue2}
  and an object that maps the keys in the dataToUpdate to database columns(jsToSql)
    {key1: "db_column_name1", key2: "db_column_name2"}
    
  returns an object with "setCols" being a string to be used in an SQL UPDATE query for which columns to set based on the values;
  "values" is an array of the new values to be updated
  
  call: sqlForPartialUpdate(
          {key1: newValue, key2: newValue2},
          {key1: "db_column_name1", key2: "db_column_name2"}
        )
          
  return: {
            setCols: `"db_column_name1"=$1, "db_column_name2"=$2`
            values: [newValue, newValue2]
          }
  
 */
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

module.exports = { sqlForPartialUpdate };
