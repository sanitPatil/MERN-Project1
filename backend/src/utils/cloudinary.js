import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";
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
            resource_type:"auto",
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

const destroyOnCloudinary = async (localFilePath) =>{
    try{
        await cloudinary.uploader.destroy(localFilePath, function(error, result) {
            if (error) {
              console.error(error);
            } else {
              console.log(result);
            }
          });      
          
    }catch(err){
        console.log("file destroy unsuccessfull!!!");
    }
}
export {
    uploadOnCloudinary,
    destroyOnCloudinary
}