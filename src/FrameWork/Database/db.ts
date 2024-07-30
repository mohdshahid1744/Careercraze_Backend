import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import SaveJobModel from "../../models/saveJobModel";

const mongoURL:string=process.env.Mongo_URL||"";
mongoose.connect(mongoURL)

const db=mongoose.connection

db.once("open",()=>{
    console.log("MongoDB connected successfully");  
})

db.on("error",(err)=>{
    console.error("Error connecting MongoDB:",err);
    
})

export default db 