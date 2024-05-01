import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin:process.env.ORIGIN,
    credentials:true
}))

app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({
    limit:"16kb",
    extended:true
}))

app.use(cookieParser());

app.use(express.static("public"));


// -- --- --- -- -- -- -- USER ROUTER -- -- -- -- -- -- --
import userRouter from "./routers/user.router.js";

app.use('/user',userRouter)

// -- --- --- -- -- -- -- VIDEO ROUTER -- -- -- -- -- -- --
import videoRouter from "./routers/video.router.js";

app.use('/user/account',videoRouter) // http://localhost:5000/user/account/
export {app}