import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { destroyOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { encrypt,dcrypt } from "../utils/Crypto.js";
import { Video } from "../models/video.model.js";
import mongoose,{ Schema } from "mongoose";
const getAllVideos = asyncHandler(async (req, res) => {
    
    const user =req?.user;
    //console.log(user);
    if(!user){
        throw new ApiError(404,"user not found!!!")
    }

    const AllVideos = await User.aggregate([
        {
          $match: {
            _id:new mongoose.Types.ObjectId(user?._id)
          }
        },
        {
          $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "result"
        },  
      },
        {
          $addFields: {
            videos:"$result"
          }
        },
        {
          $project: {
            videos:1
          }
        }
      ])
    
    if(!AllVideos){
        throw new ApiError(500,"videos not found!!!")
    }

    res.status(200)
    .json(new ApiResponse(200,AllVideos,"successfull."))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title.trim() && !description.trim()){
        throw new ApiError(400,"please provide title and description for the video")
    }
    //console.log(title,description);
    const videoFileLocalPath = req?.files?.videoFile[0].path;
    const thumbnailLocalPath = req?.files?.thumbnail[0].path;
    //console.log(videoFileLocalPath,thumbnailLocalPath);
    if(!videoFileLocalPath && !thumbnailLocalPath){
        throw new ApiError(400,"video file is not provided!!!")
    }

    const user = await User.findOne(req?.user?._id);
    //console.log(user);

    if(!user){
        throw new ApiError(500,"failed to locate user")
    }

    
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoFile && !thumbnail){
        throw new ApiError(400,"video file upload failed");
    }

    const videoPK = await encrypt(videoFile.public_id)
    const thumbnailPK = await encrypt(thumbnail.public_id)

    const video = await Video.create({
        videoFile:[videoFile.url,videoPK],
        thumbnail:[thumbnail.url,thumbnailPK],
        title,
        description,
        duration:videoFile.duration,
        owner: user._id
    })

    user.watchHistory.push(video); // 
    await user.save();
    res.status(200)
    .json(new ApiResponse(200,{},"Video Uploaded SucccessFully."))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400,"video id required!!!");
    }

    const user = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"user_details"
            }
        },
        {
            $unwind:"$user_details"
        },

        {
            $project:{
                "user_details.userName":1,
                "user_details.fullName":1,
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1
            }
        }
    ])
   
    if(!user){
        throw new ApiError(500,"data not found for given id")
    }
    //console.log(user);
    res.status(200)
    .json(new ApiResponse(200,user,"Data fetched Successfully."))
})

const updateVideo = asyncHandler(async (req, res) => {
    
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;
    const newThumbnail = req?.file?.path;
    const {title,description} = req.body;
    if(!videoId){
        throw new ApiError(400,"Video Id is not provided!!!");
    }
    
    if([newThumbnail,title,description].some((field)=> field.trim() == "")){
        throw new ApiError(400,"title,description, thumbanail is empty!!!")
    }


    const videoObject = await Video.findById(videoId);
    const deleteThumbnailAssests = await dcrypt(videoObject.thumbnail[1]);
    
    const thumbanail = await uploadOnCloudinary(newThumbnail);
    if(!thumbanail){
        throw new ApiError(500,"video Upload Failed on Cloudinary!!!");
    }
    const thumbnailPK = encrypt(thumbanail.public_id);
    const updateVideoObject = await Video.findByIdAndUpdate(videoId,{
        title,
        description,
        thumbnail:[thumbanail.url, thumbnailPK]
    },{new:true})

    if(!updateVideoObject){
        throw new ApiError(500,"failed to update video title,description and thumbnail!!!");
    }

    await destroyOnCloudinary(deleteThumbnailAssests,"video");

    res.status(200)
    .json(new ApiResponse(200,"data updated Successfully!!!"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // //TODO: delete video
    // // console.log(req?.user._id);
    if(!videoId){
        throw new ApiError(500,"VideoId required!!!");
    }
    
    const videoObject = await Video.findById(videoId);
    
    if(!videoObject){
        throw new ApiError(500,"please provide a valid video ID!!");
    }
    
    const {videoFile, thumbnail} = videoObject;
    const removeVideoAssest = await destroyOnCloudinary((await dcrypt(videoFile[1])),"video");
    const removeThumbnailAssest=await destroyOnCloudinary((await dcrypt(thumbnail[1])),"video");
    
    if(!removeThumbnailAssest && !removeVideoAssest){
        throw new ApiError(500,"assests deletion failed")
    }

    const removeVideo = await Video.findByIdAndDelete(videoId);
    if(!removeVideo){
        throw new ApiError(500,"something went wrong while deleting video!!!")
    }

    const deleteFromUserList = await User.findByIdAndUpdate(req.user?._id,{
        $pull:{
            watchHistory:videoId
        }
    },{new:true})

    if(!deleteFromUserList){
        throw new ApiError(500,"something went wrong while entry from user watch history!!!")
    }

    res.status(200)
    .json(new ApiResponse(200,deleteFromUserList,"video removed successfully."))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"video id is not provided");
    }

    const videoObject = await Video.findById(videoId);
    if(!videoObject){
        throw new ApiError(500,"Video Object Not Found!!!");
    }

    const toggleStatus = await Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished:!videoObject.isPublished
        }
    },{new:true})
    
    if(!toggleStatus){
        throw new ApiError(500,"failed to change status!!!");
    }

    res.status(200)
    .json(new ApiResponse(200,{publish:toggleStatus.isPublished},"Status changed Successfully."))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}