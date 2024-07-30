import mongoose,{Document,Schema}from "mongoose";
import bcrypt, { compare } from 'bcryptjs'
export interface IUser extends Document{
    _id: string,
    name:string,
    email:string,
    mobile:string,
    avatar?:string,
    title?:string,
    education?: { school: string, degree: string, field: string, started: Date, ended: Date }[];
    skills?: { skill: string }[]; 
    experience?: { company: string, role: string, started: Date, ended: Date }[];
    isAdmin:boolean,
    isActive:boolean,
    password:string,
    banner?: string;
    lastSeen: string;
    followers: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    matchPassword: (enteredPassword: string) => Promise<boolean>
}

const userSchema:Schema<IUser>=new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
    },
    isAdmin:{
        type:Boolean,
        required:true,
        default:false
    },
    avatar: {
        type: String,
        required: false,
        default: "Profile.png"
    },
    title:{
        type:String
    },
    education: [{
        school: String,
        degree: String,
        field: String,
        started: Date,
        ended: Date
    }],
    skills: [{
        skill: String,
    }],
    experience: [{
        company: String,
        role: String,
        started: Date,
        ended: Date
    }],
    isActive:{
        type:Boolean,
        default:true
    },
    password:{
        type:String
    },
    banner: {
        type: String,
        default: "banner.png"
    },
    lastSeen:{
        type:String,
    },
    followers: [
        {
            type: Schema.Types.ObjectId,
        }
    ],
    following: [
        {
            type: Schema.Types.ObjectId,
        }
    ],
})

userSchema.pre<IUser>('save',async function (next) {
    if(!this.isModified("password")){
       return next()
    }
    const salt=await bcrypt.genSalt(10)
    this.password=await bcrypt.hash(this.password,salt)
    next()
})
userSchema.methods.matchPassword=async function (enteredpassword:string) {
    return await bcrypt.compare(enteredpassword,this.password)
}

const userModel=mongoose.model<IUser>("User",userSchema)
export default userModel