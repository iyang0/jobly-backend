
const {
  sqlForPartialUpdate
} = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("works with blank jsToSql", function () {
    const result = sqlForPartialUpdate({
      testCol: "testVal"
    }, {});
    expect(result).toEqual({
      setCols: `"testCol"=$1`,
      values: ["testVal"],
    });
  });
  test("works with 1 item changing one value", function () {
    const result = sqlForPartialUpdate({
      testCol: "testVal"
    }, {
      testCol: "a"
    });
    expect(result).toEqual({
      setCols: `"a"=$1`,
      values: ["testVal"],
    });
  });

  test("change only one value for two columns", function () {
    const result = sqlForPartialUpdate({
      col1: "test1",
      col2: "test2"
    }, {
      col2: "bbbbb"
    });
    expect(result).toEqual({
      setCols: `"col1"=$1, "bbbbb"=$2`,
      values: ["test1", "test2"],
    });
  });
});
