const router = require ("express").Router();
const Question = require ("../models/Question");
const fs= require("fs")
const del = require("del");
const {authenticateAdmin } = require("../middlewares/questionAdminAuth");
const { uploadTestCase,
      generateIdAndDir } = require ("../middlewares/upload");
const {authGetAccess} = require ("../middlewares/questionAccessAuth");
const fieldstoUpload=[
    {name:'answer', maxCount:1},
    {name:'testGenerator', maxCount:1}
]
const logger = require("../utils/logger");
const removeDirIfFailed=async (req,folder)=>{
    const dir= `./data/${folder}/${req.objectId}`;
    try {
        await del(dir);

        logger.info(`${dir} is deleted!`);
    } catch (err) {
        logger.error(`Error while deleting ${dir}.`);
    }
}

//create question
router.post("/", authenticateAdmin , generateIdAndDir ,uploadTestCase.fields(fieldstoUpload) , async (req,res)=>{
    try{
        if(!req.body.name || !req.body.body){
            throw new Error("please complete all fields");
        }   
        //TODO :date should be handeled
        const question= new Question({
            _id:req.objectId,
            forDate:new Date(),
            name: req.body.name,
            body: req.body.body,
            examples: JSON.parse(req.body.examples),
            testGeneratorPath: req.files.testGenerator[0].path,
            answerPath: req.files.answer[0].path
        })

        await question.save().then(()=>{
            logger.info("question saved successfully");
        })

        res.status(201).send(question);
    }catch(err){
        removeDirIfFailed(req,'questions');
        logger.error(err.message);
        res.status(400).send({error:err.message});
    }

});
//get questions
router.get("/", authGetAccess, async(req,res)=>{
    try{
        //forDates should be handled
        const questions = await Question.find({});
        res.status(200).send(questions);
    }catch(err){
        logger.error(err.message);
        res.status(500).send({
            error:err.message
        });
    }
});
//get specific question
router.get("/:questionName", authGetAccess, async(req,res)=>{
    
})
//update question

//delete question

//submit questioin

//user login

//user me 

//user logout
module.exports=router;