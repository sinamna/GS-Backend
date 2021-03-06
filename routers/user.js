const router = require("express").Router();
const User = require("../models/User");
const {authenticateSuperUser} = require("../middlewares/superUserAuth");
const logger = require("../utils/logger");
const { authenticateAdmin } = require("../middlewares/questionAdminAuth");
const { authenticateUser } = require("../middlewares/userAuth");
const Question = require("../models/Question");

router.get("/",authenticateSuperUser,async(req,res)=>{
    try{
        const users = await User.find({});
        res.send(users);
    }catch(error){
        res.status(500).send({
            message:error.message
        })
    }
});

router.get("/:studentNumber",authenticateSuperUser,async(req,res)=>{
    try{
        const user = await User.findOne({
            studentNumber:req.params.studentNumber
        });
        if(!user) throw new Error("couldn't find user");
        res.send(user);
    }catch(error) {
        res.status(404).send({
            error:error.message
        })
    }
});

router.post("/",async(req,res)=>{
    try{
        if(!req.body.studentNumber ||!req.body.password){
            res.status(400).send({
                error: "Enter student number and password"  
            });
            return;
        }
        const userFound = await User.findOne({
            studentNumber:req.body.studentNumber
        });
        if(userFound){
            res.status(406).send({
                error: `${req.body.studentNumber} is already registered.`  
            });
            return;
        }
        const user= new User({
            studentNumber: req.body.studentNumber,
            password: req.body.password
        });

        await user.save();
        
        const token = await user.generateAuthToken();
        if(!token) throw new Error("token couldn't be generated");
        res.status(201).send({user,token});
    }catch(error){
        res.status(500).send({
            error:error.message
        })
    }
});


router.delete("/:studentNumber",authenticateSuperUser,async(req,res)=>{
    try{
        await User.findOneAndRemove({
            studentNumber:req.params.studentNumber
        },(err,removedUser)=>{
            if(err) throw err;
            else if(!removedUser){
                res.status(404).send({
                    error: "couldn't find user"
                });
                return;
            }
            logger.info("user successfully removed");
            res.send({
                removedUser,
                message:"user successfully removed"});
        });
    }catch(err){
        res.status(500).send({
            error:err.message
        });
    }
})


router.patch("/:studentNumber",authenticateSuperUser,async(req,res)=>{
    try{
        const user = await User.findOne({
            studentNumber:req.params.studentNumber
        })
        if(!user){
            res.status(404).send({
                error:"couldn't find user"
            });
            return;
        }
        Object.keys(req.body).forEach((fieldToUpdate)=>{
            user[fieldToUpdate] = req.body[fieldToUpdate];
        });
        await user.save();
        res.send({
            user,
            message: "user updated successfully"
        });
    }catch(err){
        res.status(500).send({
            error:"unable to patch user",
            detail:err.message
        })
    }
});
//login 
router.post("/login",async(req,res)=>{
    try{
        if(!req.body.studentNumber || !req.body.password){
            res.status(400).send({
                error:"You should complete all fields"
            });
            return;
        } 
        const user = await User.findByCredentials(req.body.studentNumber,req.body.password);
        const token = await user.generateAuthToken();

        res.status(200).send({user,token});
    }catch(err){
        logger.error(err);
        res.status(500).send({
                error:err.message
            }
        )
    }
});

//logoutroutes  
router.post("/me/logout",authenticateUser, async(req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>token.token!==req.token);
        await req.user.save();
        res.send({
            message:"logged out successfully"
        })
    }catch(err){
        res.status(500).send({
            error:err.message
        });
    }
});

router.post("/me/changepass",authenticateUser,async (req,res)=>{
    try{
        const user= req.user;
        user.password = req.body.password;
        await user.save();
        res.send({user,
            message: "password updated successfully"
        });
    }catch(err){
        res.status(500).send({
            error:err.message
        })
    }
});

router.get("/me/getquestion/", authenticateUser, async(req,res)=>{
    try{
        const questions= await Question.find({
            forDate: {
                $lte: new Date()
            }
        })
        .sort({forDate:'descending'}).then(questions=>{
            for(const question of questions){
                question.set('state','notTouched',{strict:false});
                for( let code of req.user.codes){
                    if (String(code.forQuestion) === String(question._id)){
                        question.set('state','finished',{strict:false});
                    }
                }
            }
            return questions;
        });

        res.status(200).send(questions);
    }catch(err){
        res.status(500).send({
            error:err.message
        })
    }
});

module.exports=router;