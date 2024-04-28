import cryptojs from "crypto-js";
import { ApiError } from "./ApiError.js";

const encrypt = (encryptString)=>{
    try{
        if(!encryptString){
            return null;
        }

        return cryptojs.AES.encrypt(encryptString,process.env.ENCRYPT).toString()
    }catch(err){
        throw new ApiError(505,"something went wrong in ecryption")
    }
}

const dcrypt = (dcryptString)=>{
    try{
        if(!dcryptString){
            return null;
        }
        const bytes  = cryptojs.AES.decrypt(dcryptString,process.env.ENCRYPT);
        const originalText = bytes.toString(cryptojs.enc.Utf8);
        return originalText
    }catch(err){
        throw new ApiError(505,"something went wrong in ecryption")
    }
}

export {
    dcrypt,
    encrypt
}