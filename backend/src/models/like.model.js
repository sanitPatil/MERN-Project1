import mongoose,{Schema, mongo} from "mongoose";

const likeSchema = new Schema({
    comment:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },
    video:{
        type: Schema.Types.ObjectId,
        ref:"Video"
    },
    likeBy:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref:"Tweet"
    }
},{timestamps:true})

export const Like = mongoose.model("Like",likeSchema)

