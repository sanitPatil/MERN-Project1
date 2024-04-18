import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { DB_NAME } from "../constant.js";

// METHOD FOR CONNECTING DB
const connectDB = async () =>{
    try{
        const connInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`DB Connected SuccessFully, DB Host:${connInstance.connection.host}`);
        //console.log(connInstance)
    }catch(err){
        console.log(`Error in Connecting DB`)
        throw new ApiError(500,err.message || "db not connection unsuccessful!!!")
    }
}

export default connectDB