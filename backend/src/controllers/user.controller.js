import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

// -- -- -- -- -- -- -- -- REFRESH AND ACCESS TOKEN GENERATOR -- -- -- -- -- -- -- --
const generateRefreshAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccess();
        const refreshToken = user.generateRefresh();
        
        await user.save({validateBeforeSave:false});
        //console.log(accessToken,refreshToken);
        return({accessToken,refreshToken})
    }catch(err){
        throw new ApiError(501,"Error while generating Refresh And Access Token")
    }
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

    const newUser = await User.create({
        userName:userName.toLowerCase().trim(),
        fullName:fullName,
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage.url
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

// -- -- -- -- -- -- -- -- GET SINGLE USER DATA -- -- -- -- -- -- -- --

const getSingleUser = asyncHandler(async (req,res)=>{
    
    const user = req.user;
    if(!user){
        throw new ApiError(404,"User Not Found");
    }

    res.status(200).json(new ApiResponse(200,user,"data fetch successfully."))
})

// -- -- -- -- -- -- -- -- UPDATE PASSWORD-- -- -- -- -- -- -- --

const  updatePassword = asyncHandler(async (req,res)=>{
    try{
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


    }catch(err){
        console.log(`ERROR IN UPDATE PASSWORD!!!`);
    }
})

const loggedOut = asyncHandler(async (req,res)=>{
    try{
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
    }
    catch(err){
        throw new ApiError(501,"fialed to logout")
    }
})
export {
    registerUser,
    loginUser,
    getSingleUser,
    updatePassword,
    loggedOut
}