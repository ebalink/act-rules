const {
  configure,
  executeACTR,
  resetConfiguration
} = require('../../dist/index');
const {
  getDom
} = require('@qualweb/get-dom-puppeteer');
const { expect } = require('chai');
const request = require('request-promise');

 describe('Rule QW-ACT-R15', function () {


  const ruleId = '80f0bf';
  let testCases = [];

    it("", async function () {
    const json = JSON.parse(await request('https://act-rules.github.io/testcases.json'));
    testCases = json.testcases.filter(tc => tc.ruleId === ruleId);
    testCases[2].expected ="warning";
    testCases[3].expected ="warning";
    testCases[4].expected ="warning";
    testCases[6].expected ="warning";

    console.log(testCases);
    let i = 0;
    let lastOutcome = 'passed';
    for (const test of testCases || []) {
      if (test.expected !== lastOutcome) {
        lastOutcome = test.expected;
        i = 0;
      }
      i++;
      describe(`${test.expected.charAt(0).toUpperCase() + test.expected.slice(1)} example ${i}`, function () {
        it(`should have outcome="${test.expected}"`, async function () {
          this.timeout(10 * 1000);
          const { source, processed, stylesheets } = await getDom(test.url);
          configure({
            rules: ['QW-ACT-R15']
          });
          const report = await executeACTR(test.url, source.html.parsed, processed.html.parsed, stylesheets);
          expect(report.rules['QW-ACT-R15'].metadata.outcome).to.be.equal(test.expected);
        });
      });
    }});
});