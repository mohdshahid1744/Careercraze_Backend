import userRepository from "../repository/userRepository";
import userJwt from "../Middleware/JWT/userJwt";
import userModel,{IUser} from "../models/userModel";
import { generateOTP } from "../utils/generateOtp";
import {emailVerification} from "../utils/sendMail"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { OAuth2Client } from "google-auth-library";
import { Response } from "express";
import dotenv from 'dotenv'
import sharp from 'sharp'
import crypto from 'crypto'
import jwt from "jsonwebtoken";
dotenv.config()

interface ReqBody{
    name:string,
    email:string,
    mobile:string,
    password:string,
    confirm:string
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
const createUser = async (user: ReqBody) => {
    try {
        const existingUser = await userRepository.findUser(user.email);
        console.log("LOGG",existingUser);
        
        if (existingUser) {
            if (existingUser.isActive) {
                return { status: 409 };
            }
        } else {
            const newUser = new userModel(user);
            await newUser.save();
            console.log("NEW USER",newUser);
            
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
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyLogin= async (userdata: Login) => {
    try {
        const loginResponse = await userRepository.validateUser(userdata)
        console.log(loginResponse, 'gotbfrom rep');
        return loginResponse
    } catch (err) {
        throw new Error(`Failed to sign in: ${err}`);
    }
}



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
        let user = await userModel.findOne({ $or: [{ googleId: userId }, { email: email }] });
        
        if (!user) {
            user = new userModel({
                googleId: userId,
                email,
                name,
                password: "defaultPassword",
            });
            await user.save();
        }
        const secretKey = process.env.USER_SECRET_KEY;
        if (!secretKey) {
            throw new Error('Secret key is not defined');
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, { expiresIn: '1h' });

        return { status: 200, user: user, success: true, token: token };
    } catch (err) {
        throw new Error(`Failed to sign in using Google: ${err}`);
    }
};

const sendMail= async (email: string,res:Response) => {
    try {
        let otp = generateOTP()
        console.log(otp, email);
        await emailVerification(email, otp)
        res.cookie('otp', otp, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
        console.log('email sended');
        return { success: true, otp: otp }
    } catch (err) {
        throw new Error(`Failed to send mail: ${err}`);
    }
}
const applyApplication=async(userData:any)=>{
    try {
        const cv = randomImageName()
        const params = {
            Bucket: bucket_name,
            Key: cv,
            Body: userData.cv.buffer,
            ContetType: userData.cv.mimetype,
        }
       
        const command = new PutObjectCommand(params)
        await s3.send(command);
        userData.cv = cv
        let response = await userRepository.saveApplication(userData)
        return response
    } catch (error) {
       console.error("Failed to apply for job",error);
        
    }
}
export default{
    createUser,
    verifyLogin,
    sendMail,
    authenticateWithGoogle,
    applyApplication
}