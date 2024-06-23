import mongoose,{Document,Schema} from "mongoose";
import bcrypt from 'bcryptjs'
export interface recruiter extends Document{
    _id:string,
    name:string,
    email:string,
    mobile:string,
    companyName:string,
    password:string,
    avatar?:string,
    companyEmail:string,
    isActive:boolean,
    matchPassword:(enteredPassword:string)=>Promise<boolean>
}

const recruiterSchema:Schema<recruiter>=new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String
    },
    companyName:{
        type:String,
    },
    companyEmail:{
        type:String,
    },
    avatar: {
        type: String,
        required: false,
        default: "Profile.png"
    },
    password:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    }
})

recruiterSchema.pre<recruiter>('save',async function(next){
    if(!this.isModified("password")){
        return next()
    }
    const salt=await bcrypt.genSalt(10)
    this.password=await bcrypt.hash(this.password,salt)
    next()
})
recruiterSchema.methods.matchPassword=async function (enteredPassword:string) {
    return await bcrypt.compare(enteredPassword,this.password)
}
const recruiterModel=mongoose.model<recruiter>("Recruiter",recruiterSchema)
export default recruiterModel