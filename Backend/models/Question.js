const mongoose = require("mongoose");

// sourced questions ko database mein save karne ke liye schema
// (User.js ke jaisa hi pattern hai)
const questionSchema = new mongoose.Schema({
    question : {
        type : String,
        required : true,
    },
    company : {
        type : String,
    },
    role : {
        type : String,
    },
    difficulty : {
        type : String,   // basic / intermediate / senior
    },
    sourceUrl : {
        type : String,
    },
    category : {
        type : String,
        default : 'technical',   // abhi sourced questions technical hi maan rahe hain
    }
}, { timestamps : true })   // createdAt / updatedAt auto add ho jaate hain

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
