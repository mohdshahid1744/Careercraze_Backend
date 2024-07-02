import mongoose, { Document, Schema } from "mongoose";
export interface Skill extends Document{
    _id:string,
    skill:string
}

const skillSchema:Schema<Skill>=new Schema({
    skill:{
        type:String,
        required:true
    }
})

const SkillModel = mongoose.model<Skill>("Skills", skillSchema);

export default SkillModel