
import userService  from "../services/userService";
import userRepository from "../repository/userRepository";
import { Request,Response } from "express";
import userJwt from "../Middleware/JWT/userJwt";
import {emailVerification} from "../utils/sendMail"
import { generateOTP } from "../utils/generateOtp";
import userModel from "../models/userModel";
import { JwtPayload } from 'jsonwebtoken';
import jwt from "jsonwebtoken";
import sharp from 'sharp';
import crypto from 'crypto'
import {S3Client, PutObjectCommand } from '@aws-sdk/client-s3';



interface ReqBody {
    userId: string;
    name: string;
    email: string;
    mobile: string;
    password: string;
    confirm: string;
    otp: string;
    createdAt: Date;
    isBlocked: boolean;
  }

  interface signupSubmitResponse {
    status: number;
    message: string;
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
  const signupSubmit = async (req: Request<{}, {}, ReqBody>, res: Response<signupSubmitResponse>) => {
    try {
      const { email } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 400, message: "User already exists" });
    }
      const otp = generateOTP();
      console.log("OTPP",otp);
      
      await emailVerification(req.body.email, otp);
      const token = userJwt.generateToken(otp);
      console.log("Generated Token:", token);
      
      res.cookie('otp', token, { httpOnly: true, expires: new Date(Date.now() + 180000), sameSite: 'none', secure: true });
res.cookie('message', token, { httpOnly: true, expires: new Date(Date.now() + 900000), sameSite: 'none', secure: true });

console.log("SFDFSFS",req.cookies);

      
      console.log("Set-Cookie Header:", res.getHeader('Set-Cookie'));
      
      res.status(201).json({ status: 201, message: "User created successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 500, message: "Internal server error" });
    }
  };
  
  interface loginSubmitResponse {
    status: number;
    message: string;
    _id?: string;
    token?: string;
    isAdmin?: boolean;
    isActive?:boolean
  }

  const loginSubmit = async (req: Request<{}, {}, ReqBody>, res: Response<loginSubmitResponse>) => {
    try {
      const { email, password } = req.body;
      console.log(email, password, 'REQQQ');
  
      const userdata = {
        email,
        password,
      };
  
      const loginResponse = await userService.verifyLogin(userdata);
      console.log(loginResponse, 'in controller');
  
      if (loginResponse.success) {
        const user = loginResponse.user;
        const userDataString = user ? user._id : undefined;
        console.log("DASADS", userDataString);
  
        const isAdmin = user ? user.isAdmin : false;
        const isActive = user ? user.isActive : false;
  
  
        res.status(200).json({
          status: 200,
          message: 'Login successful',
          _id: userDataString,
          isAdmin: isAdmin,
          token: 'JWT-TOKEN',
          isActive: isActive,
        });
      } else {
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
  };
  
interface VerifyOtpRequestBody {
    enterOtp: string;
    otp:string,
    userdata: {
        name: string;
        email: string;
        mobile: string;
        password: string;
        confirm: string;
    };
}

const verifyOtp = async (
  req: Request<{}, {}, ReqBody>,
  res: Response<any, Record<string, any>>
) => {
  try {
    const { otp } = req.body;
    console.log("OTPP", otp);
    
    const token = req.cookies.otp;
    console.log("TOKEEN ", token);

    if (!token) {
      return res.status(400).json({ status: 400, message: "OTP cookie not found" });
    }

    const secretKey = process.env.USER_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Secret key is not defined in environment variables");
    }

    let verified = false;
    if (otp === token) {
      verified = true;
    } else {
      try {
        const jwtOtp: JwtPayload | string = jwt.verify(token, secretKey);
        if (typeof jwtOtp !== "string" && jwtOtp.id === otp) {
          verified = true;
        }
      } catch (error) {
        console.error("EOORO");
        
      }
    }

    if (verified) {
      const newUser = await userService.createUser(req.body);
      console.log("New user created:", newUser);
      return res.status(200).json({ status: 200, message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ status: 400, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ status: 500, message: "Internal server error" });
  }
};


  const resendOtp = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;
        res.clearCookie('otp');

        const otp = generateOTP();
      const token = userJwt.generateToken(otp);
      console.log("Generated Token:", token);
  
      res.cookie('otp', token, { httpOnly: true, expires: new Date(Date.now() + 180000), sameSite: 'none', secure: true });
        const response = await userService.sendMail(email,res); 
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
};
const getAllUsers = async (req:Request, res:Response) => {
  try {
      const users = await userModel.find()  
      res.json({ users })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
  } else {
      res.status(500).json({ error: 'An unexpected error occurred.' });
  }
  }
}
const googleAuth = async (req: Request, res: Response) => {
  try {
    const credential = req.body
    console.log("SADa",credential);
    
    const response = await userService.authenticateWithGoogle(credential)
    console.log("RESSS",response);
    res.status(200).json(response);
      
  } catch (error) {
      console.error("Google authentication failed:", error);
      return res.status(401).json({ error: "Google authentication failed" });
  }
};
const getUserCount = async (req: Request, res: Response) => {
  try {
      const count = await userModel.countDocuments();
      res.status(200).json({ count });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
  }
}
const updateUserStatus = async (req:Request, res:Response) => {
  const { email } = req.params;
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      user.isActive = !user.isActive;
      await user.save();
      const users = await userModel.find();
      res.json({ users });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    
  }
}
const updateProfile=async(req:Request,res:Response)=>{
  try {
    const { id } = req.params;
    const existingUser = await userModel.findById(id);
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
const getUser=async(req:Request,res:Response)=>{
  try {
    const {id}=req.params
    let response=await userRepository.getUser(id)
    res.json({response})
  } catch (error) {
    console.error("ERRORRR");
    
  }
}
const updateEducation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { school, degree, field, started, ended } = req.body;
  console.log("Request from body",req.body);
  

  try {
    const response = await userRepository.educationData(id, school, degree, field, started, ended);
    console.log("Response from educationData:", response);
    if (response && response.success) {
      res.status(200).json({ message: response.message, updatedData: response.response });
    } else if (response) {
      res.status(400).json({ message: response.message });
    } else {
      res.status(400).json({ message: 'Unexpected error occurred' });
    }
  } catch (error) {
    console.error('Error updating education data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
const updateExperience=async(req:Request,res:Response)=>{
  const { id } = req.params;
  const {company,role,started,ended}=req.body
  console.log("RE0",req.body);
  
  try {
    const response=await userRepository.experienceData(id,company,role,started,ended)
    console.log("RESADS",response);
    
    res.json({response})
  } catch (error) {
    console.error('Error updating experience data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}
const updateSkills=async(req:Request,res:Response)=>{
  const { id } = req.params;
  const {skill}=req.body
  console.log("ASD",req.body);
  
  try {
    const response=await userRepository.skillData(id,skill)
    console.log("SKILL resp",response);
    res.json({response})
    
  } catch (error) {
    console.error('Error updating skill data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}
const editSkills = async (req: Request, res: Response) => {
  const { userId, skillId } = req.params;
  const { skill: newSkill } = req.body;

  try {
    const user = await userModel.findOneAndUpdate(
      { _id: userId,"skills._id": skillId },{ $set: { "skills.$.skill": newSkill } 
      },
      { 
        new: true 
      }
    );

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User or Skill not found' });
    }
  } catch (error) {
    console.error(`Error updating skill: ${error}`);
    res.status(500).json({ message: 'Error updating skill', error });
  }
};

const deleteSkill = async (req: Request, res: Response) => {
  const { userId, skillId } = req.params;

  try {
    console.log("Received request to delete skill:", userId, skillId);

    const user = await userModel.findOneAndUpdate(
      { _id: userId, "skills._id": skillId },
      { $pull: { skills: { _id: skillId } } },
      { new: true }
    );

    if (user) {
      console.log("Filtered skills array after deletion:", user.skills);
      res.json({ success: true, message: 'Skill deleted successfully' });
    } else {
      res.status(404).json({ error: 'User or Skill not found' });
    }
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const editEducation = async (req: Request, res: Response) => {
  const { userId, eduId } = req.params;
  const { school, degree, field, started, ended } = req.body;

  try {
    const user = await userModel.findOneAndUpdate(
      { _id: userId, "education._id": eduId },
      {
        $set: {
          "education.$.school": school,
          "education.$.degree": degree,
          "education.$.field": field,
          "education.$.started": started,
          "education.$.ended": ended
        }
      },
      { new: true }
    );

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User or Education not found' });
    }
  } catch (error) {
    console.error(`Error updating education: ${error}`);
    res.status(500).json({ message: 'Error updating education', error });
  }
};
const deleteEducation = async (req: Request, res: Response) => {
  const { userId, eduId } = req.params;

  try {
    console.log("Received request to delete skill:", userId, eduId);

    const user = await userModel.findOneAndUpdate(
      { _id: userId, "education._id": eduId },
      { $pull: { education: { _id: eduId } } },
      { new: true }
    );

    if (user) {
      res.json({ success: true, message: 'education deleted successfully' });
    } else {
      res.status(404).json({ error: 'User or education not found' });
    }
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
const deleteExperience = async (req: Request, res: Response) => {
  const { userId, expId } = req.params;

  try {
    console.log("Received request to delete skill:", userId, expId);

    const user = await userModel.findOneAndUpdate(
      { _id: userId, "experience._id": expId },
      { $pull: { experience: { _id: expId } } },
      { new: true }
    );

    if (user) {
      res.json({ success: true, message: 'experience deleted successfully' });
    } else {
      res.status(404).json({ error: 'User or experience not found' });
    }
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
const editExperience = async (req: Request, res: Response) => {
  const { userId, expId } = req.params;
  const { company, role, started, ended } = req.body;

  try {
    const user = await userModel.findOneAndUpdate(
      { _id: userId, "experience._id": expId },
      {
        $set: {
          "experience.$.company": company,
          "experience.$.role": role,
          "experience.$.started": started,
          "experience.$.ended": ended
        }
      },
      { new: true }
    );

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User or Experience not found' });
    }
  } catch (error) {
    console.error(`Error updating experience: ${error}`);
    res.status(500).json({ message: 'Error updating experience', error });
  }
};


const updateProfileData=async(req:Request,res:Response)=>{
  const {id}=req.params
  const {mobile,title,name}=req.body
  try {
    const response=await userRepository.profileData(id,mobile,title,name)
  } catch (error) {
    console.error('Error updating Profile data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}
const applyApplication=async(req:Request,res:Response)=>{
  try {
    const { userId, name, email, mobile,jobid } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'CV file is required' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'CV file must be a PDF' });
    }

    const userData = {
      userId,
      name,
      email,
      mobile,
      jobid,
      cv: req.file,
    };
    console.log("AS",userData);
    
    const response = await userService.applyApplication(userData);
    console.log("HKK",response);
    
    if (response) {
      return res.status(200).json({ message: 'Application submitted successfully',userData });
    } else {
      return res.status(500).json({ error: 'Failed to submit application' });
    }
  } catch (error) {
    console.error("Failed to apply for job", error);
    return res.status(500).json({ error: 'An error occurred while submitting the application' });
  }
}

  export default{
    signupSubmit,
    loginSubmit,
    verifyOtp,
    resendOtp,
    googleAuth,
    getUserCount,
    getAllUsers,
    updateUserStatus,
    updateProfile,
    getUser,
    updateEducation,
    updateExperience,
    updateSkills,
    updateProfileData,
    applyApplication,
    editSkills,
    deleteSkill,
    editEducation,
    editExperience,
    deleteEducation,
    deleteExperience
  }