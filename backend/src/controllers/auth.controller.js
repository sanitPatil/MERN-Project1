import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
const verifyJWT = asyncHandler(async (req,res,next)=>{
    
    try{
        const tokens = req.cookies?.accessToken;

        if(!tokens){
            throw new ApiError(401,"Unauthorized Request!");
        }

        const decodedToken = jwt.verify(tokens,process.env.ACCESS_TOKEN_SECRET);

        if(!decodedToken){
            throw new ApiError(401,"Unauthorized Request!");
        }
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        req.user = user;
        
        next()
    }catch(err){
        throw new ApiError(401,"user not login!!!")
    }
})

export {
    verifyJWT
}