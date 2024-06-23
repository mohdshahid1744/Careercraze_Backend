import recruiterRepository from "../repository/recruiterRepository";
import recruiterModel from "../models/recruiterModel";
import { generateOTP } from "../utils/generateOtp";
import { emailVerification } from "../utils/sendMail";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { OAuth2Client } from "google-auth-library";
import sharp from 'sharp'
import crypto from 'crypto'
import pdf from 'pdf-parse';

import dotenv from "dotenv";
import JobModel from "../models/jobModel";
dotenv.config()

interface ReqBody {
  name: string;
  email: string;
  mobile: string;
  companyEmail: string;
  companyName: string;
  password: string;
  confirm: string;
}



const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
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

const createRecruite = async (datas: ReqBody) => {
  try {
    const existingUser = await recruiterModel.findOne({ email: datas.email });
    if (existingUser) {
      if (existingUser.isActive) {
        return { status: 409 };
      }
    } else {
      const newUser = new recruiterModel(datas);
      await newUser.save();
      return { status: 201 };
    }
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Internal server error" };
  }
}

interface Login {
  email: string;
  password: string;
}

const verifyLogin = async (datas: Login) => {
  try {
    const loggingIn = await recruiterRepository.validateRecruiter(datas);
    return loggingIn;
  } catch (error) {
    throw new Error(`Failed to sign in: ${error}`);
  }
}

const sendMail = async (email: string, res: Response) => {
  try {
    let otp = generateOTP();
    await emailVerification(email, otp);
    res.cookie('otp', otp, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
    console.log('email sent');
    return { success: true, otp: otp };
  } catch (error) {
    throw new Error(`Failed to send email: ${error}`);
  }
}

const creatingJob = async (data: any) => {
  try {
    const companylogo = randomImageName();
    console.log("SDF", companylogo);

    const buffer = await sharp(data.companylogo.buffer)
      .resize({ height: 1080, width: 1080, fit: "cover" })
      .toBuffer();
    console.log("BUFRE", buffer);

    const params = {
      Bucket: bucket_name,
      Key: companylogo,
      Body: buffer,
      ContentType: data.companylogo.mimetype,
    };

    const datas = new PutObjectCommand(params);
    await s3.send(datas);
    let response = await recruiterRepository.createJob(data, companylogo);
    return response;
  } catch (err) {
    console.error(`Error creating job: ${err}`);
    return null;
  }
}

const getJob = async (userId: string)=> {
  try {
    let data = await recruiterRepository.getJob(userId)
        

    return data
} catch (err) {
    console.error(`Error finding job: ${err}`);
    return null;
}
}

const getalljob=async()=>{
    try {
        const jobs=await recruiterRepository.getalljobs()
        console.log("SERRRR",jobs);
        if (jobs?.jobs) {
            for (let job of jobs?.jobs) {
                const getObjectParams = {
                    Bucket: bucket_name,
                    Key: job.companylogo,
                }
                const getObjectCommand = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
                job.companylogo = url
                console.log(url);
            }
        }
        return jobs
    } catch (err) {
        console.error(`Error jobs: ${err}`);
        return null;
    }
}
const getSingle=async(id:string)=>{
    try {
        const job=await recruiterRepository.getSingle(id)
        return job
    }  catch (err) {
        console.error(`Error jobs: ${err}`);
        return null;
    }
}
const getCandidate = async (jobid: string) => {
  try {
    const job = await recruiterRepository.getCandidate(jobid);
    console.log("DAS", job);

    if (job && job.applicants) {
      const updatedApplicants = await Promise.all(job.applicants.map(async (user: any) => {
        console.log(user, 'user00');

        const getObjectParams = {
          Bucket: bucket_name,
          Key: user.cv,
        };

        const getObjectCommand = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
        console.log("Signed URL:", url);

        user.cv = url;
        return user;
      }));

      job.applicants = updatedApplicants;
    }

    return job;
  } catch (err) {
    console.error(`Error getting candidate: ${err}`);
    return null;
  }
};
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const authenticateWithGoogle = async (credential: any) => {
    try {
        console.log('Credential received:', credential, typeof credential);

        const idToken = credential.credential;
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        console.log(ticket, 'ticket');
        const payload = ticket.getPayload();

        if (!payload) {
            throw new Error("Google authentication failed: Payload is missing");
        }
        const userId = payload.sub;
        const email = payload.email;
        const name = payload.name || "Default Name";
        let user = await recruiterModel.findOne({ $or: [{ googleId: userId }, { email: email }] });
        if (!user) {
            user = new recruiterModel({
                googleId: userId,
                email,
                name,
                password: "defaultPassword",
            });
            await user.save();
        }
        return { status:200,user: user, success: true }
    } catch (err) {
        throw new Error(`Failed to sign in using google: ${err}`);
    }
};
const appliction=async(userData:any)=>{
try {
  const name=randomImageName()
  const params={
    Bucket: bucket_name,
    Key: name,
    Body: userData.cv.buffer,
    ContetType: userData.cv.mimetype,
  }
  const pdfdata=await pdf(userData.cv.buffer)

} catch (err) {
  console.error('Error while saving Applicants:', err)
  throw err
}
}

export default {
  createRecruite,
  verifyLogin,
  sendMail,
  creatingJob,
  getJob,
  getalljob,
  getSingle,
  authenticateWithGoogle,
  getCandidate
}
