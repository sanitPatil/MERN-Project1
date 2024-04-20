import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path:"./.env"
})

const PORT = process.env.PORT || 4000;
connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`Listening on PORT:${PORT}`);
    })
})
.catch((err)=>{
    console.log(`app failed!!! ${err.message}`);
    process.exit(1);
})

