import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) =>{
    try{
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log(`file uploaded on cloud successfully: ${response.url}`);
        fs.unlinkSync(localFilePath);
        return response;
    }catch(err){
        fs.unlinkSync(localFilePath)
        console.log("file upload on cloudinary unsuccesful!!!");
    }
}

const deleteOncloudinary = async (cloudFilePath) =>{
    try{
        if(!cloudFilePath) return null;

        const response = await cloudinary.uploader.destroy(cloudFilePath);
        console.log(`File Deleted Successfully.`);
        return response;
    }catch(err){
        console.log(`file deletion on cloud is unsuccessfull!!!`);
    }
}

export {
    uploadOnCloudinary,
    deleteOncloudinary
}