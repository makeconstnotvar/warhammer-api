async function getJson(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const json = await response.json();
  return { json, response };
}

async function runTestCases(cases) {
  const failures = [];

  for (const testCase of cases) {
    try {
      await testCase.run();
      console.log(`PASS ${testCase.name}`);
    } catch (error) {
      failures.push({ error, name: testCase.name });
      console.error(`FAIL ${testCase.name}`);
      console.error(error.stack || error.message || error);
    }
  }

  return failures;
}

module.exports = {
  getJson,
  runTestCases,
};
