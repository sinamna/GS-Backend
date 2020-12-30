const router = require ("express").Router();
const Question = require ("../models/Question");
const del = require("del");
const logger = require("../utils/logger");

const {authenticateAdmin } = require("../middlewares/questionAdminAuth");

const { uploadTestCase,
      generateIdAndDir,
      submittion,
        patchHandler} = require ("../middlewares/upload");

const {authGetAccess} = require ("../middlewares/questionAccessAuth");
const { authenticateUser } = require("../middlewares/userAuth");

const fieldstoUpload=[
    {name:'answer', maxCount:1},
    {name:'testGenerator', maxCount:1}
]

const removeDir=async (id,folder)=>{
    const dir= `./data/${folder}/${id}`;
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
        if(!req.files.testGenerator || !req.files.answer){
            throw new Error("both testGenerator and answer files should be send")
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
        //bug in deleting folders in unexpected fields
        
        await question.save().then(()=>{
            logger.info("question saved successfully");
        })
        delete question.examples[0]._id;
        await question.save();
        res.status(201).send(question);
    }catch(err){
        removeDir(req.objectId,'questions');
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
router.get("/:id", authGetAccess, async(req,res)=>{
    try{
        const question = await Question.findById({
            _id:req.params.id
        });
        if(!question) throw new Error("Couldnt find requested question");
        res.status(200).send(question);
    }catch(err){
        res.status(500).send({
            message:err.message
        })
    }
});
//update question
router.patch("/:id", authenticateAdmin, patchHandler.fields(fieldstoUpload), async(req,res)=>{
    try{
        const question = await Question.findOne({
            _id:req.params.id
        }).catch(err=>{
            //customize errors
            throw new Error("couldn't find the question");
        })
        // console.log(question.examples[0]);
    // console.log(JSON.parse(req.body.examples));
    Object.keys(req.body).forEach(fieldToUpdate=>{
        if(fieldToUpdate=== "examples"){
            const exampleList= JSON.parse(req.body.examples);
            exampleList.forEach(obj=>{
                console.log(obj);
                const questionExamples=question.examples.slice();
                questionExamples.push(obj)
                // question.examples.push({
                //     "input":obj.input,
                //     "output": obj.output
                // });
                question.examples=questionExamples;
                console.log(question.examples);

            })
            // question.examples=[...question.examples,...JSON.parse(req.body[fieldToUpdate])];
            // question.examples.push()
        }
        //add date parsing
        question[fieldToUpdate]=req.body[fieldToUpdate];
    });
    await question.save().then(()=>{
        logger.info("question updated successfully");
    })
    res.status(200).send(question);
    }catch(err){
        logger.error({
            error:err.message
        });
        res.status(500).send({
            error:err.message
        })
    }

});
//delete question
router.delete("/:id",authenticateAdmin,async (req,res)=>{
    try{
        await Question.findOneAndRemove({
            _id:req.params.id
        }).then(removedQuestion=>{
            logger.info("question successfully removed");
            removeDir(removedQuestion._id,"questions");
            res.status(200).send({
                removedQuestion,
                message: "successfully removed"});
        });
    }catch(err){
        logger.error(err.message);
        res.status(500).send({
            message: err.message
        });
    }
});

//submit questioin
router.post("/submit",authenticateUser,submittion.single('code'),async(req,res)=>{
    try{
            // possibly doing other things in here

        res.status(200).send(" file submitted successfully")
    }catch(err){
        removeDir("user-submits",`${req.user.studentNumber}/${req.body.questionID}`);
        logger.error(err);
        err.send(
            err
        )
    }
});

module.exports=router;