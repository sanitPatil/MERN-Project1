import { app } from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 4000;
connectDB()
.then(()=>{
    app.on("Error",()=>{
        console.log(`connection error || app failed!!!`);
    })

    app.listen(PORT,()=>{
        console.log(`Listening on PORT:${PORT}`);
    })
})
.catch((err)=>{
    console.log(`app failed!!!`);
    process.exit(1);
})

