import recruiterModel,{recruiter} from "../models/recruiterModel";
import JobModel from "../models/jobModel";
const mongoose = require('mongoose');

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv'
import { Request,Response } from "express";
dotenv.config()

interface Recruiter{
    name:string,
    email:string,
    mobile:string,
    companyName:string,
    companyEmail:string,
    password:string,
    isActive?:boolean
}

interface Login{
    email:string,
    password:string
}
interface userData{
    jobid:string,
    userId:string,
    name:string,
    email:string,
    mobile:string,
    cv:string
}
let access_key = process.env.USER_ACCESS_KEY;
let secret_key = process.env.USER_SECRET_KEY;
let bucket_name = process.env.BUCKET_NAME;

const s3: S3Client = new S3Client({
  credentials: {
    accessKeyId: access_key || '',
    secretAccessKey: secret_key || ''
  },
  region: process.env.BUCKET_REGION
});

const findRecruiter=async(email:string)=>{
    try {
        const recruiter=await recruiterModel.findOne({email:email})
    } catch (error) {
        console.error(error);
        
    }
}


const createRecruiter=async(recruiterdatas:Partial<recruiter>)=>{
    try {
        let created=await recruiterModel.create({
            name:recruiterdatas.name,
            email:recruiterdatas.email,
            mobile:recruiterdatas.mobile,
            companyName:recruiterdatas.companyName,
            companyEmail:recruiterdatas.companyEmail,
            password:recruiterdatas.password
        })
        await created.save()
    } catch (error) {
        console.error("Error creating recruiter",error);
        
    }
}

const validateRecruiter=async(datas:Login)=>{
    try {
        const recruiter=await recruiterModel.findOne({email:datas.email})
        if(!recruiter){
            console.log("User not found");
            return {success:false,message:"User not found"}
        }
        if(recruiter.isActive===false){
            console.log("User is inactive");
            return {success:false,message:"User is inactive"}
        }
        const passwordMatch=await recruiter.matchPassword(datas.password)
        if(passwordMatch){
            return {success:true,message:"Login successful",recruiter}
        }else{
            console.log("Incorrect password");
            return {success:false,message:"Incorrect password"}
        }
    } catch (error) {
        console.error('Error validating user:', error);
        return { success: false, message: 'Error validating user' };
    }
}

const getAll = async (res: Response) => {
    try {
        const users = await recruiterModel.find();
        console.log('users', users);
        res.json({ users });
        return users;
    } catch (err) {
        console.error(`Error on getting all user: ${err}`);
        res.status(500).json({ error: 'Internal server error' });
    }
}
const getRecruiter=async(id:string)=>{
    try {
      let user = await recruiterModel.findOne({ _id: id })
      const getObjectParams = {
          Bucket: bucket_name,
          Key: user?.avatar,
      }
      const getObjectCommand = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
      if (user) {
          user.avatar = url
      }
  
      return user
  } catch (err) {
      console.error(`Error on getting user status: ${err}`);
      return null;
  }
  }

const updateStatus=async(Recruiter:Recruiter)=>{
    try {
        const statusUpdate=await recruiterModel.updateOne({email:Recruiter.email},{$set:{isActive:!Recruiter.isActive}})
        console.log("Updated",statusUpdate);
        return true
    } catch (error) {
       console.error("ERRor",error);
        return null
    }
}
const findByEmail=async(email:string)=>{
    try {
        const recruiter=await recruiterModel.findOne({email})
        return recruiter
    } catch(err){
        console.error(`Error finding user by email: ${err}`);
        return null;
    }
}
const createJob=async(data:any,companylogo:string)=>{
    try {
      
        let skills = data.skills ? 
            (data.skills.includes(',') ? data.skills.split(',') : [data.skills]) : [];
        const job = await JobModel.create({
            jobrole: data.jobrole,
            companyname: data.companyname,
            minexperience: data.minexperience,
            maxexperience: data.maxexperience,
            minsalary: data.minsalary,
            maxsalary: data.maxsalary,
            joblocation: data.joblocation,
            emptype: data.emptype,
            skills: skills,
            description: data.description,
            companylogo: companylogo,
            recruiterId: data.recruiterId, 
        });
 
        return true;
    } catch (err) {
        console.error(`Error creating job: ${err}`);
        return null;
    }
};
const getJob=async(userId:string)=>{
    try {
        let getJob=await JobModel.find({recruiterId:userId})
        console.log("AS",getJob);
        
        let response={jobs:getJob || []}
        return response
    } catch (err) {
        console.error(`Error displaying job: ${err}`);
        return null;
    }
}

const getalljobs=async()=>{
    try {
        const jobs=await JobModel.find().sort({createdAt:-1})
        let response={jobs:jobs || []}
        return response
    }catch (err) {
        console.error(`Error getting job list: ${err}`);
        return null;
    }
}
const getSingle=async(id:string)=>{
    try {
        const job=await JobModel.findOne({_id:id})
        return job
    } catch (err) {
        console.error(`Error creating job: ${err}`);
        return null;
    }
}

const getCandidate=async(jobid:string)=>{
    try {
        const job=await JobModel.findOne({_id:jobid})
        console.log("SDF",job);
        
        return job
    } catch (error) {
        console.error(`Error getting job candidate: ${error}`);
        return null;
    }
}
const Application=async(data:userData)=>{
    try {
        if(!data){
            throw new Error("Data not found")
        }
        const applicant={
            userId:data.userId,
            name:data.name,
            email:data.email,
            mobile:data.mobile,
            cv:data.cv

        }
        let job=await JobModel.findOne({_id:data.jobid})
        let response=await JobModel.updateOne({_id:data.jobid},{$set:{applicants:applicant}})
        console.log("SDA",response);
        if(response.modifiedCount==0){
            throw new Error('No documents were matched or modified during update operation.');
        }
        return true
    }catch (err) {
        console.error('Error while saving Applicants:', err)
        throw err
    }
}
const getSkills=async(data:userData)=>{
try {
    const skills=await JobModel.findOne({_id:data.jobid},{skills:1})
    return skills
} catch (err) {
    console.error('Error while skilld from job:', err)
    throw err
}
}
const profileData=async(userId:string,mobile:string,name:string,companyName:string,companyEmail:string)=>{
    try {
      let response=await recruiterModel.updateOne({_id:userId},{$set:{mobile:mobile,name:name,companyName:companyName,companyEmail:companyEmail}})
      if (response.modifiedCount > 0) {
        return { success: true, message: 'Profile Data updated successfully' };
    } else {
        return { success: false, message: 'No image was updated' };
    }
  
  } catch (err) {
    console.error(`Error on user cover: ${err}`);
    return null;
  }
  }
export default{
findRecruiter,
createRecruiter,
validateRecruiter,
updateStatus,
getAll,
findByEmail,
createJob,
getJob,
getalljobs,
getSingle,
Application,
getSkills,
getCandidate,
getRecruiter,
profileData
}