import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";
import { ApiError } from './ApiError.js';
dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
  
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        console.log(`File Upload On Cloudinary successfully` );
        fs.unlinkSync(localFilePath)
        //console.log(response);
        return response;
    }catch(err){
        fs.unlinkSync(localFilePath);
        console.log("file upload UnSuccessFulle");
    }
}

const destroyOnCloudinary = async (public_key,format="image") => {
      //console.log(public_key);
      const result = await cloudinary.uploader.destroy(public_key,{resource_type:format});
      console.log(result);
      return result;

}   
export {
    uploadOnCloudinary,
    destroyOnCloudinary
}

