import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {destroyOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import { encrypt,dcrypt } from "../utils/Crypto.js";

// -- -- -- -- -- -- -- -- REFRESH AND ACCESS TOKEN GENERATOR -- -- -- -- -- -- -- --
const generateRefreshAndRefreshToken = async(userId)=>{
   
        const user = await User.findById(userId);
        const accessToken = user.generateAccess();
        const refreshToken = user.generateRefresh();
        
        await user.save({validateBeforeSave:false});
        //console.log(accessToken,refreshToken);
        return({accessToken,refreshToken})
}

// -- -- -- -- -- -- -- -- REGISTER USER -- -- -- -- -- -- -- --
const registerUser = asyncHandler(async (req,res)=>{
    
    const {userName,fullName,email,password} = req.body;
    if([userName,fullName,email,password].some((fields)=> fields?.trim() === "")){
        throw new ApiError(401,"All Fields are Required");
    }

    const user = await User.findOne({
        $or:[{userName},{email}]
    })
    //console.log(user);
    if(user){
        throw new ApiError(401, "User with same user Id and email is alerady exits");
    }

    const avatarLocalFilePath = req.files?.avatar[0]?.path;
    const CoverImageLocalFilePath = req.files?.coverImage[0]?.path;
    //console.log(req.files);
    // console.log(avatarLocalFilePath);
    // console.log(CoverImageLocalFilePath);
    if(!avatarLocalFilePath){
        throw new ApiError(401,"Avatar is Required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath);
    const coverImage = await uploadOnCloudinary(CoverImageLocalFilePath);
    
    if(!avatar){
        throw new ApiError(501,"Faild to Uplaod Files on Cloud");
    }

    const avatarPK =await encrypt(avatar.public_id);
    const coverImagePK =await encrypt(coverImage.public_id);
    const newUser = await User.create({
        userName:userName.toLowerCase().trim(),
        fullName:fullName,
        email,
        password,
        avatar:[avatar.url,avatarPK],
        coverImage:[coverImage.url,coverImagePK]
    });

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500,"Error while registering user!");
    }

    res.status(200)
    .json(new ApiResponse(200,createdUser,"User Created Successfully..."));
})

// -- -- -- -- -- -- -- -- LOGIN USER -- -- -- -- -- -- -- --
const loginUser = asyncHandler(async (req,res)=>{
    const {userName,email,password} = req.body;

    if([userName,email,password].some((fields)=> fields?.trim() == "")){
        throw new ApiError(401,"all fields are required")
    }

    const user = await User.findOne({
        $or:[{userName},{email}]
    })

    // console.log(user);
    if(!user){
        throw new ApiError(401,"User with Email and UserId is not Exists!")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if(!isPasswordValid){
        throw new ApiError(401,"password does not matched")
    }

    const {accessToken,refreshToken} = await generateRefreshAndRefreshToken(user._id);
    //console.log(accessToken,refreshToken);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
    
    const options ={
        httpOnly:true,
        secure:true
    }

    res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        loggedInUser,
        "Login User SuccessFully"
    ))



})

// -- -- -- -- -- -- -- -- LOGGED OUT USER-- -- -- -- -- -- -- --
const loggedOut = asyncHandler(async (req,res)=>{
    
        const user =await User.findByIdAndUpdate(req.user?._id,{
            $unset:{
                refreshToken:1 // make the field to unset 
            }
        },
        {
            new:true
        }
    );
    if(!user){
        throw new ApiError(501,"fialed to logout")
    }
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Log out SuccessFully."))
})

// -- -- -- -- -- -- -- -- GET SINGLE USER DATA -- -- -- -- -- -- -- --

const getSingleUser = asyncHandler(async (req,res)=>{
    
    const user = req.user;
    if(!user){
        throw new ApiError(404,"User Not Found");
    }

    res.status(200).json(new ApiResponse(200,user,"data fetch successfully."))
})

// -- -- -- -- -- -- -- -- GENERATE NEW REFRESH TOKENS -- -- -- -- -- -- -- --

const genNewToken = asyncHandler(async (req,res)=>{
    const user = await User.findById(req?.user?._id).select("-password");
    //console.log(user);
    if(!user){
        throw new ApiError(501,`user not found!|| genNT!!!`)
    }

    const isRefreshToken = jwt.verify(req?.cookies?.refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    if(!isRefreshToken){
        throw new ApiError(400,`refresh token does not match!`);
    }
    const options = {
        httpOnly:true,
        secure:true
    }
    const {accessToken} =await generateRefreshAndRefreshToken(user._id);
    
    res.status(200)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponse(200,{},"tokens genrated successfully."))
})

// -- -- -- -- -- -- -- -- UPDATE PASSWORD-- -- -- -- -- -- -- --

const  updatePassword = asyncHandler(async (req,res)=>{
    
        const {oldPassword,newPassword} = req.body;
        const user =await User.findById(req.user?._id);
        if(!user){
            throw new ApiError(501,"ENCOUNTER ISSUE WHILE UPDATING PASSWORD...")
        }
        

        const isOldPassword = user.isPasswordCorrect(oldPassword);
        
        if(!isOldPassword){
            throw new ApiError(401,"Password does not Match!!!");
        }

        user.password = String(newPassword);

        user.save({validateBeforeSave:false});

        res.status(200)
        .json(new ApiResponse(200,{},"Password changed SuccessFully."))
})

// -- -- -- -- -- -- -- -- UPDATE USER-- -- -- -- -- -- -- --

const updateUser = asyncHandler(async (req,res)=>{
    
    const {userName, email,fullName} = req.body;

    if([userName,email,fullName].some((fields)=> (fields?.trim() == "")))
    {
        throw new ApiError(405,"Values must be provided")
    }

    //console.log(userName,email,fullName);

    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiError(404,"User Not Found!")
    }

    const updatedUser = await User.findByIdAndUpdate(user._id,{
        userName,
        email,
        fullName
    },{
        new:true
    })

    if(!updatedUser){
        throw new ApiError(504,"Failed To Update")
    }

    res.status(200)
    .json(new ApiResponse(200,{},"user details updated successfully."))
    
    
})

// -- -- -- -- -- -- -- -- UPDATE COVER-IMAGE-- -- -- -- -- -- -- --

const updateCoverImage = asyncHandler(async (req,res)=>{
    
        const localPath = req?.file?.path;
        
        if(!localPath){
            throw new ApiError(404,"please provide file for cover-image");
        }
        
        const coverImage = await uploadOnCloudinary(localPath);
        if(!coverImage){
            throw new ApiError(505,"something went wrong {cover-Image}!!!");
        }
        const user =await User.findOne(req?.user?._id);
        //console.log(user);
        if(!user){
            throw new ApiError(500,"User Not Found");
        }
        const userPrevPK = user.coverImage[1];
        //console.log(userPrevPK);
        const coverImagePK =encrypt(coverImage.public_id)
        //console.log(coverImagePK);
        const ImageUpdated = await User.findByIdAndUpdate(user._id,{
            coverImage:[coverImage.url,coverImagePK]
        },{
            new:true
        })

        if(!ImageUpdated){
            throw new ApiError(505,"something went wrong with image update!!!");
        }
        await destroyOnCloudinary(dcrypt(userPrevPK));
       
        res.status(200)
        .json(new ApiResponse(200,{},"Cover Image updated Successfully."))
})

// -- -- -- -- -- -- -- -- UPDATE AVATAR-- -- -- -- -- -- -- --
const updateAvatar = asyncHandler(async (req,res)=>{
    
        const localPath = req?.file?.path;
        
        if(!localPath){
            throw new ApiError(404,"please provide file for cover-image");
        }
        
        const avatar = await uploadOnCloudinary(localPath);
        if(!avatar){
            throw new ApiError(505,"something went wrong {cover-Image}!!!");
        }
        const user =await User.findOne(req?.user?._id);
        //console.log(user);
        if(!user){
            throw new ApiError(500,"User Not Found");
        }
        const userPrevPK = user.avatar[1];
        //console.log(userPrevPK);
        const avatarPK =encrypt(avatar.public_id)
        //console.log(coverImagePK);
        const ImageUpdated = await User.findByIdAndUpdate(user._id,{
            avatar:[coverImage.url,avatarPK]
        },{
            new:true
        })

        if(!ImageUpdated){
            throw new ApiError(505,"something went wrong with image update!!!");
        }
        await destroyOnCloudinary(dcrypt(userPrevPK));
       
        res.status(200)
        .json(new ApiResponse(200,{},"Avatar updated Successfully."))
})

// -- -- -- -- -- -- -- -- DELETE USER-- -- -- -- -- -- -- --
const deleteUser = asyncHandler(async (req,res)=>{
        const {password} = req.body;
        if(!password){
            throw new ApiError(404,"PLEASE ENTER PASSWORD!!!")
        }
        //console.log(req.user);
        const user = await User.findOne(req.user?._id);
        //console.log(user);
        if(!user){
            throw new ApiError(505,"User Not Found!!!")
        }
        const isPasswordValid = await user.isPasswordCorrect(password);
        //console.log(isPasswordValid, "\n");
        if(!isPasswordValid){
            throw new ApiError(400,"PASSWORD DOES NOT MATCH!!!")
        }
        const {avatar,coverImage} = user;
        await destroyOnCloudinary(dcrypt(avatar[1]))
        await destroyOnCloudinary(dcrypt(coverImage[1]))
       const userDeleted = await User.findByIdAndDelete(user?._id);
        
        if(!userDeleted){
            throw new ApiError(505,"SOMETHING WENT WRONG WHILE DELETING USER!!!")
        }
        const options = {
            httpOnly:true,
            secure:true
        }

        res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200,{},"User Deleted successfully!!!"))
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username} = req.params;
    //console.log(username);
    if(!username){
        throw new ApiError(400,"username must be provided!!")
    }

    const channel = await User.aggregate([
        {
            $match:{
                userName:username.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isPublished:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
        
    ])
    //console.log(channel);
    res.status(200)
    .json(new ApiResponse(200,channel,"successfully get channel data"))
})
export {
    registerUser,
    loginUser,
    getSingleUser,
    updatePassword,
    loggedOut,
    genNewToken,
    updateUser,
    updateCoverImage,
    updateAvatar,
    deleteUser,
    getUserChannelProfile
}