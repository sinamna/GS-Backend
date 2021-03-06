const mongoose= require("mongoose")
const exampleSchema = new mongoose.Schema({
    input:{
        required:true,
        type:String 
    },
    output:{
        type:String,
        required:true
    }
})
const questionSchema= new mongoose.Schema({
    forDate:{
        type:Date,
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    body:{
        type: String,
        required:true,
    },
    examples: [exampleSchema],
    author:{
        type: mongoose.Types.ObjectId,
        ref: 'QuestionAdmin',
        required:true
    },
    testGeneratorPath:{
        type:String,
        required:true
    },
    answerPath:{
        type: String,
        required:true
    },
    score:{
        type: Number,
        required:true
    },
    isWeb:{
        type: Boolean,
        required: true
    }
});
// TODO toJson 
questionSchema.methods.toJSON=function(){
    const question = this;
    const questionObj=question.toObject();
    // questionObj.testGeneratorPath= "./"+questionObj.testGeneratorPath;
    // questionObj.answerPath= "./"+questionObj.answerPath;
    delete questionObj.testGeneratorPath;
    delete questionObj.answerPath;
    delete questionObj.author;
    delete questionObj.__v;
    // delete questionObj._id;
    return questionObj;
}

module.exports=new mongoose.model("Question",questionSchema);