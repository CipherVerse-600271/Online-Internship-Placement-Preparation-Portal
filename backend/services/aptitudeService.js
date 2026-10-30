const TESTS = [
  { id: "quantitative-foundations", title: "Quantitative Foundations", category: "quantitative", durationMinutes: 10, questions: [
    { id: "quant-1", question: "A product costs Rs. 500 and has a 20% discount. What is its sale price?", options: ["Rs. 350", "Rs. 400", "Rs. 450", "Rs. 480"], correctAnswer: 1, explanation: "Twenty percent of 500 is 100, so the sale price is 400.", difficulty: "easy" },
    { id: "quant-2", question: "What is the average of 12, 18, and 24?", options: ["16", "18", "20", "22"], correctAnswer: 1, explanation: "(12 + 18 + 24) / 3 = 18.", difficulty: "easy" },
    { id: "quant-3", question: "If 5 workers finish a task in 12 days, how many worker-days are required?", options: ["17", "48", "60", "72"], correctAnswer: 2, explanation: "Worker-days are 5 x 12 = 60.", difficulty: "medium" },
  ] },
  { id: "logical-reasoning-foundations", title: "Logical Reasoning Foundations", category: "logical", durationMinutes: 10, questions: [
    { id: "logical-1", question: "Find the next number: 2, 6, 12, 20, ?", options: ["28", "30", "32", "34"], correctAnswer: 1, explanation: "The differences are 4, 6, 8, so the next difference is 10.", difficulty: "easy" },
    { id: "logical-2", question: "All mentors are readers. Some readers are writers. Which statement must be true?", options: ["All writers are mentors", "Some mentors are writers", "All mentors are readers", "No readers are writers"], correctAnswer: 2, explanation: "Only the first relationship is guaranteed by the statement.", difficulty: "medium" },
    { id: "logical-3", question: "If BLUE is coded as 2-12-21-5, what is RED coded as?", options: ["18-5-4", "17-4-3", "18-4-5", "19-5-4"], correctAnswer: 0, explanation: "The code uses each letter's alphabet position.", difficulty: "easy" },
  ] },
  { id: "verbal-ability-foundations", title: "Verbal Ability Foundations", category: "verbal", durationMinutes: 10, questions: [
    { id: "verbal-1", question: "Choose the word closest in meaning to 'diligent'.", options: ["Careless", "Hardworking", "Uncertain", "Silent"], correctAnswer: 1, explanation: "Diligent means consistently hardworking and careful.", difficulty: "easy" },
    { id: "verbal-2", question: "Choose the grammatically correct sentence.", options: ["She don't enjoy tests.", "She does not enjoys tests.", "She does not enjoy tests.", "She not enjoy tests."], correctAnswer: 2, explanation: "After does not, use the base verb form: enjoy.", difficulty: "easy" },
    { id: "verbal-3", question: "Complete the sentence: The team worked ___ to meet the deadline.", options: ["hard", "hardly", "harderly", "hardness"], correctAnswer: 0, explanation: "Hard is the correct adverb in this context.", difficulty: "medium" },
  ] },
];

const categoryLabels = { quantitative: "Quantitative aptitude", logical: "Logical reasoning", verbal: "Verbal ability" };
const listTests = () => TESTS.map(({ questions, ...test }) => ({ ...test, questionCount: questions.length, categoryLabel: categoryLabels[test.category] }));
const getTest = (testId) => TESTS.find((test) => test.id === testId) || null;
const publicQuestions = (test) => test.questions.map(({ correctAnswer, explanation, ...question }) => question);

function gradeAttempt(test, answers) {
  const validIds = new Set(test.questions.map((question) => question.id));
  const answerMap = new Map();
  for (const answer of Array.isArray(answers) ? answers : []) {
    if (answer && validIds.has(answer.questionId) && Number.isInteger(answer.selectedOption)) answerMap.set(answer.questionId, answer.selectedOption);
  }
  let correctCount = 0; let incorrectCount = 0; let unansweredCount = 0;
  const gradedAnswers = test.questions.map((question) => {
    const selectedOption = answerMap.get(question.id);
    const answered = Number.isInteger(selectedOption) && selectedOption >= 0 && selectedOption < question.options.length;
    const isCorrect = answered && selectedOption === question.correctAnswer;
    if (!answered) unansweredCount += 1; else if (isCorrect) correctCount += 1; else incorrectCount += 1;
    return { questionId: question.id, selectedOption: answered ? selectedOption : null, isCorrect };
  });
  const totalQuestions = test.questions.length;
  return { answers: gradedAnswers, correctCount, incorrectCount, unansweredCount, totalQuestions, score: correctCount, percentage: totalQuestions ? Number(((correctCount / totalQuestions) * 100).toFixed(2)) : 0 };
}

module.exports = { TESTS, listTests, getTest, publicQuestions, gradeAttempt };

