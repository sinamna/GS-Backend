const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")
const jwt = require ("jsonwebtoken")
const config = require("../utils/config")
const superSchema= new mongoose.Schema({
    username:{
        type:String,
        required: true,
        trim: true,
        unique: true,
        toLower:true,
        minlength: 6
    },
    password:{
        type:String,
        required: true
    },
    tokens:[{

        token:{
            type:String,
            required:true
        }
    }]
});

superSchema.statics.findByCredentials= async(username,password)=>{
    const admin= await SuperUser.findOne({username});
    
    if(!admin){
        throw new Error("Unable to login");
    
    }
    
    const isPassMatch = await bcrypt.compare(password, admin.password);
    if(!isPassMatch) {
        throw new Error("Unable to login")
    };
    return admin
}

superSchema.methods.generateAuthToken=async function(){
    const admin =this;
    const token = jwt.sign({_id:admin._id.toString() },config.JWT_SECRET,{
        expiresIn:'7 days'
    });

    admin.tokens=admin.tokens.concat({token});
    await admin.save();
    return token;
};

superSchema.pre('save',async function(next){
    const superUser=this;

    if(superUser.isModified('password')){
        superUser.password=await bcrypt.hash(superUser.password,8);

        next();
    }
});
superSchema.methods.toJSON= function(){
    const admin =this;
    const adminObj= admin.toObject();
    
    delete adminObj._id;
    delete adminObj.password;
    delete adminObj.tokens;
    delete adminObj.__v;
    return adminObj;
}
const SuperUser=new mongoose.model('SuperUser', superSchema);
module.exports= SuperUser;