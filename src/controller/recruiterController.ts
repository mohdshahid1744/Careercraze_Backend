import recruiterService from "../services/recruiterService";
import recruiterRepository from "../repository/recruiterRepository";
import { Request,Response } from "express";
import { emailVerification } from "../utils/sendMail";
import { sendRejectionEmail } from "../utils/rejectionMail";
import { sendVerificationEmail } from "../utils/verificationMail";
import { generateOTP } from "../utils/generateOtp";
import recruiterModel from "../models/recruiterModel";
import recruiterJwt from "../Middleware/JWT/recruiterJwt";
import sharp from 'sharp';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { JwtPayload } from 'jsonwebtoken';
import jwt from "jsonwebtoken";
import crypto from 'crypto'
import userRepository from "../repository/userRepository";
import JobModel from "../models/jobModel";

interface ReqBody{
    // recruiterId:string,
    name:string,
    email:string,
    mobile:string,
    companyEmail:string,
    companyName:string,
    status:string
    password:string,
    confirm:string,
    otp:string,
}

interface signupForm{
    status:number,
    message:string
}

const recruiterSignup=async (req:Request<{},{},ReqBody>,res:Response<signupForm>)=>{
    try {
        const {email}=req.body
        // const newUser=await recruiterService.createRecruite(req.body)
        const existingUser=await recruiterModel.findOne({email})
     if(existingUser){
        return res.status(400).json({ status: 400, message: "User already exists" }); 
     }   
     const otp=generateOTP()
     console.log("OTP",otp);
     
     await emailVerification(email,otp)
     const token=recruiterJwt.generateToken(otp)
     console.log("Generated Token:", token);
  
     res.cookie('otp', token, { httpOnly: true, expires: new Date(Date.now() + 180000), sameSite: 'none', secure: true });
     console.log("REQQQUEST",req.cookies);
     
     console.log("Set-Cookie Header:", res.getHeader('Set-Cookie'));
      
     res.status(201).json({ status: 201, message: "User created successfully" });
   } catch (error) {
     console.error(error);
     res.status(500).json({ status: 500, message: "Internal server error" });
   }
}

interface loginForm {
    status: number;
    message: string;
    _id?: string;
    token?: string;
    isAdmin?: boolean;
  }

const loginSubmit=async(req:Request<{},{},ReqBody>,res:Response<loginForm>)=>{
    try {
        const {email,password}=req.body
        console.log("REQ",email,password);
        const datas={
            email,
            password
        }
        const loginResponse=await recruiterService.verifyLogin(datas)
        if(loginResponse.success){
            const user = loginResponse.recruiter;
            const userDataString = user ? user._id : undefined;
            res.status(200).json({
                status: 200,
                message: 'Login successful',
                _id: userDataString,
                token: 'JWT-TOKEN',
              });
        }else{
          if (loginResponse.message === 'User is inactive') {
            res.status(403).json({
              status: 403,
              message: 'User is blocked',
            });
          } else if (loginResponse.message === 'Incorrect password') {
            res.status(400).json({
              status: 400,
              message: 'Incorrect Password',
            });
          } else if (loginResponse.message === 'User not found') {
            res.status(404).json({
              status: 404,
              message: 'User not found',
            });
          } else {
            res.status(400).json({
              status: 400,
              message: 'Login failed',
            });
          }
        }
    } catch (error) {
        console.error(error);
      res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}

const verifyOTP=async(req:Request<{},{},ReqBody>,res:Response<any,Record<string,any>>)=>{
    try {
        const {otp}=req.body
        const token=req.cookies.otp
        if(!token){
            return res.status(400).json({ status: 400, message: "OTP cookie not found" });
        }
        let secretKey=process.env.RECRUITER_SECRET_KEY;
        if (!secretKey) {
            throw new Error("Secret key is not defined in environment variables");
          }
          let verified=false;
          if(otp===token){
            return true
          }else{
            try {
                const jwtOtp: JwtPayload | string = jwt.verify(token, secretKey);
                if (typeof jwtOtp !== "string" && jwtOtp.id === otp) {
                  verified = true;
                }
            } catch (error) {
                console.error("ERROR");
                
            }
          }    
          if(verified){
            const newUser=await recruiterService.createRecruite(req.body)
            console.log("New user created:", newUser);
            return res.status(200).json({ status: 200, message: "OTP verified successfully" });
          } else {
            return res.status(400).json({ status: 400, message: "Invalid OTP" });
          }
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ status: 500, message: "Internal server error" });
    }
}

const resendOTP=async(req:Request,res:Response)=>{
  try {
    const email=req.body.email;
  res.clearCookie('otp')
  const otp=generateOTP()
  const token=recruiterJwt.generateToken(otp)
  console.log("Generated Token:", token);
  
      res.cookie('otp', token, { httpOnly: true, expires: new Date(Date.now() + 180000), sameSite: 'none', secure: true });
        const response = await recruiterService.sendMail(email,res); 
        console.log(response);
        if (response.success) {
          res.status(201).json({ message: "OTP sent successfully" });
      } else {
          res.status(400).json({ message: "Failed to send OTP" });
      }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
const getRecruiterCount = async (req: Request, res: Response) => {
  try {
      const count = await recruiterModel.countDocuments();
      res.status(200).json({ count });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
  }
}
const getRecruiter=async(req:Request,res:Response)=>{
  try {
    const {id}=req.params
    let response=await recruiterRepository.getRecruiter(id)
    res.json({response})
  } catch (error) {
    console.error("ERRORRR");
    
  }
}

const updateStatus = async (req: Request, res: Response) => {
  const { email } = req.params;
 
  try {
    const user = await recruiterModel.findOne({ email });
    if (user) {
      user.isActive = !user.isActive;
      await user.save();
      const users = await recruiterModel.find();
      res.json({ users });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    
  }
}

const updateVerification = async (req: Request, res: Response) => {
  const { email } = req.params;
  const { status, reason } = req.body;

  if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
  }

  try {
      const user = await recruiterModel.findOne({ email });

      if (!user) {
          return res.status(404).json({ message: 'Recruiter not found' });
      }

      if (user.status !== 'pending') {
          return res.status(400).json({ message: 'Recruiter status is not pending' });
      }

      user.status = status;
      await user.save();
      if (status === 'rejected') {
          await RejectionEmail(user.email, reason);
      }
      if (status === 'verified') {
          await VerificationEmail(user.email);
      }
      const users = await recruiterModel.find(); 
      return res.status(200).json({ message: `Recruiter status updated to ${status}`, users });
  } catch (error) {
      console.error('Error updating recruiter status:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};

const getStatus=async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const recruiter = await recruiterModel.findById(userId);
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    res.json({ status: recruiter.status }); 
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

const getAll=async(req:Request,res:Response)=>{
  try {
    console.log('get controlerr');
          let users=await recruiterRepository.getAll(res)
          console.log(users,'uuu');
          const response = {
            users: users 
        };
        console.log(response);

        
  } catch (error) {
    console.error(error);
    
  }
}
const createJob = async (req: Request, res: Response) => {
  try {
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);
    if (!req.file) {
      return res.status(400).json({ error: 'Company logo is required' });
    }
    const jobData = {
      jobrole: req.body.jobrole,
      companyname: req.body.companyname,
      minexperience: req.body.minexperience,
      maxexperience: req.body.maxexperience,
      minsalary: req.body.minsalary,
      maxsalary: req.body.maxsalary,
      joblocation: req.body.joblocation,
      emptype: req.body.emptype,
      skills: req.body.skills,
      description: req.body.description,
      companylogo: req.file.buffer,
      recruiterId:req.body.recruiterId
    };
    console.log("ASD",jobData);
    
    const response = await recruiterService.creatingJob(jobData);
    return res.json({ response });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getJob=async(req:Request,res:Response)=>{
  try {
    const {userId} =req.params
    let jobs=await recruiterService.getJob(userId)
    res.json({jobs})
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
const getalljob=async(req:Request,res:Response)=>{
  try {
    const jobs=await recruiterService.getalljob()
    res.json({jobs})
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
const searchJob = async (req: Request, res: Response) => {
  try {
    const { searchTerm } = req.body;
    console.log("Search Term:", req.body);

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const matchedJobs = await JobModel.find({
      joblocation: { $regex: new RegExp(searchTerm, 'i') }
    });

    for (let job of matchedJobs) {
      const getObjectParams = {
        Bucket: bucket_name,
        Key: job.companylogo,
      };
      const getObjectCommand = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
      job.companylogo = url;
      console.log(`Generated URL for ${job.companyname}: ${url}`);
    }

    return res.json({ matchedJobs });
  } catch (error) {
    console.error('Error searching jobs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
const deleteJob=async(req:Request,res:Response)=>{
  try {
    const postId=req.body.postId
    console.log("SA",postId);
    const result=await JobModel.findByIdAndDelete(postId)
    if (!result) {
      return res.status(404).json({ message: 'Job post not found' ,success:true});
    }

    res.status(200).json({ message: 'Job post deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting job post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
let bucket_name = process.env.BUCKET_NAME;
let access_key = process.env.USER_ACCESS_KEY;
let secret_key = process.env.USER_SECRET_KEY;
const s3: S3Client = new S3Client({
  credentials: {
    accessKeyId: access_key || '',
    secretAccessKey: secret_key || ''
  },
  region: process.env.BUCKET_REGION
});

const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      jobrole,
      companyname,
      minexperience,
      maxexperience,
      minsalary,
      maxsalary,
      joblocation,
      emptype,
      skills,
      description
    } = req.body;

    const existingJob = await JobModel.findById(id);
    if (!existingJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    let companylogo = existingJob.companylogo;

    if (req.file) {
      companylogo = randomImageName();
      console.log("Generated Image Name:", companylogo);

      const buffer = await sharp(req.file.buffer)
        .resize({ height: 1080, width: 1080, fit: "cover" })
        .toBuffer();
      console.log("Processed Buffer:", buffer);

      const params = {
        Bucket: bucket_name,
        Key: companylogo,
        Body: buffer,
        ContentType: req.file.mimetype,
      };

      const uploadCommand = new PutObjectCommand(params);
      await s3.send(uploadCommand);
    }

    existingJob.jobrole = jobrole;
    existingJob.companyname = companyname;
    existingJob.minexperience = minexperience;
    existingJob.maxexperience = maxexperience;
    existingJob.minsalary = minsalary;
    existingJob.maxsalary = maxsalary;
    existingJob.joblocation = joblocation;
    existingJob.emptype = emptype;
    existingJob.skills = skills;
    existingJob.description = description;
    existingJob.companylogo = companylogo;

    const updatedJob = await existingJob.save();

    res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const getSingle=async(req:Request,res:Response)=>{
  try {
    const {id}=req.params
    const jobs=await recruiterService.getSingle(id)
    res.json({jobs})
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
const googleAuth = async (req: Request, res: Response) => {
  try {
    const credential = req.body
    console.log("SADa",credential);
    
    const response = await recruiterService.authenticateWithGoogle(credential)
    console.log("RESSS",response);
    res.status(200).json(response);
      
  } catch (error) {
      console.error("Google authentication failed:", error);
      return res.status(401).json({ error: "Google authentication failed" });
  }
};
const getCandidate = async (req: Request, res: Response) => {
  try {
    const { jobid } = req.params;
    const response = await recruiterService.getCandidate(jobid);
    
    if (!response) {
      return res.status(404).json({ error: `Job with ID ${jobid} not found` });
    }
    
    console.log("RSAD", response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const updateProfile=async(req:Request,res:Response)=>{
  console.log("SGD");
  
  try {
    const { id } = req.params;
    console.log("REQ",req.params);
    
    const existingUser = await recruiterModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    let avatar = existingUser.avatar;
    if(req.file){
      avatar = randomImageName()
      const buffer = await sharp(req.file.buffer)
      .resize({ height: 1080, width: 1080, fit: "cover" })
      .toBuffer();
    console.log("Processed Buffer:", buffer);
    const params = {
      Bucket: bucket_name,
      Key: avatar,
      Body: buffer,
      ContentType: req.file.mimetype,
    };

    const uploadCommand = new PutObjectCommand(params);
    await s3.send(uploadCommand);
    }
    existingUser.avatar = avatar;

    const updateUser = await existingUser.save();
    res.status(200).json({ message: 'User Profile updated successfully', job: updateUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
const updateProfileData=async(req:Request,res:Response)=>{
  const {userId}=req.params
  const {mobile,name,companyName,companyEmail}=req.body
  try {
    const response=await recruiterRepository.profileData(userId,mobile,name,companyName,companyEmail)
    if (response) {
      res.json({ success: true, response });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating Profile data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}
const RejectionEmail = async (email: string,reason:string) => {
  try {

    await sendRejectionEmail(email,reason);
    console.log('Rejection email sent successfully');
  } catch (error) {
    console.error('Error sending rejection email:', error);
    
  }
};
const VerificationEmail = async (email: string) => {
  try {

    await sendVerificationEmail(email);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending Verification email:', error);
    
  }
};
const getPdf = async (req: Request, res: Response) => {
  const url = req.query.url as string;

  if (!url) {
    res.status(400).send('URL is required');
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch the PDF');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading file', error);
    res.status(500).send('Error downloading file');
  }
};
const searchRecruiter = async (req: Request, res: Response) => {
  try {
    const { text } = req.query;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Invalid or missing text parameter' });
      return;
    }
    
    const response = await recruiterRepository.searchRecruiter(text);
    console.log("SEARCH", response);
    res.status(200).json({ users: response }); 
  } catch (error) {
    console.error('Error finding searching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const follow=async(req:Request,res:Response)=>{
  const {userId,guestId}=req.params
  console.log("PARAMSS",req.params);
  
  try {
    let response=await recruiterRepository.follow(userId,guestId)
    console.log("FOLLOW CON",response);
    res.status(200).json({response})
    
  } catch (error) {
    console.error('Error Foolowing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
const unfollow=async(req:Request,res:Response)=>{
  const {userId,guestId}=req.params
  try {
    let response=await recruiterRepository.unfollow(userId,guestId)
    console.log("UNFOLLOW CON",response);
    res.status(200).json({response})
  } catch (error) {
    console.error('Error Unfoolowing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default{
  recruiterSignup,
  loginSubmit,
  verifyOTP,
  resendOTP,
  getRecruiterCount,
  updateStatus,
  getAll,
  createJob,
  getJob,
  getalljob,
  getSingle,
  googleAuth,
  deleteJob,
  updateJob,
  getCandidate,
  getRecruiter,
  updateProfile,
  updateProfileData,
  searchJob,
  updateVerification,
  getStatus,
  getPdf,
  searchRecruiter,
  follow,
  unfollow
}