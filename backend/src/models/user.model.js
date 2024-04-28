import mongoose,{Schema, model} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    avatar:[
        {
            type:String,
            required:true
        }
    ],
    coverImage:[{
        type:String,
    }],
    password:{
        type:String,
        required:true
    },
    refreshToken:{
        type:String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ]

},{timestamps:true});

userSchema.pre("save",async function(next){ // function use beacuse arrow does not provide refference 
    if(!this.isModified("password") ) next(); // beacuase pre is middlelware so add next() function 

    this.password = await bcrypt.hash(this.password,9);
    //console.log("password saved successfully");
    next();
})


userSchema.pre("save",async function(next){
    if(!this.isModified("refreshToken")) next();

    this.refreshToken = this.generateRefresh();
    next();
})


userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccess = function(){
    return jwt.sign({ // jwt is bearer token -> only give access to holder
        _id:this._id,
        email:this.email,
        userName:this.userName,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}


userSchema.methods.generateRefresh = function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}


export const User = model("User",userSchema);