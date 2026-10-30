const test = require("node:test");
const assert = require("node:assert/strict");
const { getTest, gradeAttempt } = require("../services/aptitudeService");
test("grades correct, incorrect, and unanswered answers", () => {
  const result = gradeAttempt(getTest("quantitative-foundations"), [{ questionId: "quant-1", selectedOption: 1 }, { questionId: "quant-2", selectedOption: 0 }]);
  assert.equal(result.correctCount, 1); assert.equal(result.incorrectCount, 1); assert.equal(result.unansweredCount, 1); assert.equal(result.percentage, 33.33);
});

