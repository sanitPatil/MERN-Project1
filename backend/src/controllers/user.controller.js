import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary,deleteOncloudinary} from "../utils/cloudinary.js";
// -- -- -- -- -- -- -- -- REGISTER USER -- -- -- -- -- -- -- --
const registerUser = asyncHandler(async (req,res)=>{
    
    const {userName,fullName,email,password} = req.body;
    if([userName,fullName,email,password].some((fields)=> fields.trim() === "")){
        throw new ApiError(401,"All Fields are Required");
    }

    const user = await User.findById({
        $or:[{userName},{email}]
    })

    if(user){
        throw new ApiError(401, "User with same user Id and email is alerady exits");
    }

    const avatarLocalFilePath = req?.files?.avatar[0].path;
    const CoverImageLocalFilePath = req?.files?.coverImage[0].path;
    
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

export {
    registerUser
}