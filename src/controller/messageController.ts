import messageRepository from "../repository/messageRepository";
import messageService from "../services/messageService";
import { Request,Response } from "express";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto'

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
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
const sendMessage = async (req: Request, res: Response) => {
    const { chatId, userId, message } = req.body;
    let filePath = '';
    let fileType = '';

    try {
        if (req.file) {
            const name = randomImageName();
            const params = {
                Bucket: bucket_name,
                Key: name,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };
            const command = new PutObjectCommand(params);
            await s3.send(command);
            

            filePath = name;
            fileType = req.file.mimetype;
        }
        const response = await messageRepository.sendMessage(chatId, userId, message, filePath, fileType);
        return res.status(200).json(response);
    } catch (error) {
        console.error("Error sending messages", error);
        return res.status(500).json({ error: "Failed to send message" });
    }
};
const getMessage=async(req:Request,res:Response)=>{
    const {chatId}=req.params
try {
    const response=await messageService.getMessage(chatId)
    console.log("SADd",response);
    
    res.status(200).json(response)
} catch (error) {
   console.error("Error getting messages",error);
    
}
}
const deleteMessage=async(req:Request,res:Response)=>{
    const {chatId}=req.params
    try {
        const response=await messageRepository.deleteChat(chatId)
        res.status(200).json(response)
    } catch (error) {
        console.error("Error deleting messages",error);  
    }
}
const createChat=async(req:Request,res:Response)=>{
    const {userId,guestId}=req.params
    try {
        const response=await messageService.createChat(userId,guestId)
        res.status(200).json(response)
    } catch (error) {
        console.error("Error sending chats",error); 
    }
}
const getChatList=async(req:Request,res:Response)=>{
    const {userId}=req.params
    try {
        const response=await messageService.getChatList(userId)
        res.status(200).json(response)
    } catch (error) {
        console.error("Error getting chats",error);  
    }
}
const editMessage=async(req:Request,res:Response)=>{
    try {
        const {messageId,newMessage}=req.body
        const response=await messageRepository.editMessage(messageId,newMessage)
        res.status(200).json(response)
    } catch (error) {
        console.error("Error editting message",error);  
    }
}
export default{
    sendMessage,
    getMessage,
    createChat,
    getChatList,
    deleteMessage,
    editMessage
}