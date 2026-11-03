const questionBank = {
  quantitative: {
    name: "Quantitative Aptitude",
    durationSeconds: 600,
    questions: [
      { id: "quant-1", text: "A train travels 120 km in 2 hours. What is its average speed?", options: ["40 km/h", "50 km/h", "60 km/h", "80 km/h"], correctOption: 2 },
      { id: "quant-2", text: "What is 25% of 240?", options: ["40", "50", "60", "80"], correctOption: 2 },
      { id: "quant-3", text: "If 3x = 27, what is x?", options: ["6", "7", "8", "9"], correctOption: 3 },
      { id: "quant-4", text: "The average of 10, 20 and 30 is:", options: ["15", "20", "25", "30"], correctOption: 1 },
      { id: "quant-5", text: "A product costs ₹800 after a 20% discount. What was its original price?", options: ["₹900", "₹960", "₹1,000", "₹1,200"], correctOption: 2 }
    ]
  },
  logical: {
    name: "Logical Reasoning",
    durationSeconds: 600,
    questions: [
      { id: "logical-1", text: "Find the next number: 2, 4, 8, 16, __", options: ["18", "24", "30", "32"], correctOption: 3 },
      { id: "logical-2", text: "Which one does not belong?", options: ["Square", "Triangle", "Circle", "Cube"], correctOption: 3 },
      { id: "logical-3", text: "If CAT is coded as DBU, how is DOG coded?", options: ["EPH", "EOG", "FPH", "DPH"], correctOption: 0 },
      { id: "logical-4", text: "All roses are flowers. Which statement must be true?", options: ["All flowers are roses", "Some roses are not flowers", "Every rose is a flower", "No rose is a flower"], correctOption: 2 },
      { id: "logical-5", text: "Find the next letter: A, C, F, J, O, __", options: ["S", "T", "U", "V"], correctOption: 2 }
    ]
  },
  verbal: {
    name: "Verbal Ability",
    durationSeconds: 600,
    questions: [
      { id: "verbal-1", text: "Choose the synonym of 'Concise'.", options: ["Lengthy", "Brief", "Unclear", "Complex"], correctOption: 1 },
      { id: "verbal-2", text: "Choose the antonym of 'Expand'.", options: ["Extend", "Increase", "Contract", "Enlarge"], correctOption: 2 },
      { id: "verbal-3", text: "Choose the grammatically correct sentence.", options: ["She go to college.", "She goes to college.", "She going to college.", "She gone to college."], correctOption: 1 },
      { id: "verbal-4", text: "Fill in the blank: They have lived here ___ 2020.", options: ["for", "from", "since", "during"], correctOption: 2 },
      { id: "verbal-5", text: "Choose the correctly spelled word.", options: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"], correctOption: 2 }
    ]
  }
};

module.exports = questionBank;
