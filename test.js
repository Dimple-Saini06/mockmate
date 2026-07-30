const questionBank = require('./Data/questions.json');

const categories = Object.keys(questionBank);

const randomCategories = categories[Math.floor(Math.random() * categories.length)];

const questionCategory = questionBank[randomCategories];
const randomQuestion = questionCategory[Math.floor(Math.random() * questionCategory.length)];

console.log(categories, randomCategories, questionCategory, randomQuestion);

console.log('----------------------------------------');
console.log('Category:', randomCategories);
console.log('Question:', randomQuestion.question);
console.log('----------------------------------------');