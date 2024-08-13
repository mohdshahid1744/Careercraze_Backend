import MessageModel from "../models/messageModel";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv'
import ChatModel from "../models/chatModel";
dotenv.config()
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


const sendMessage = async (chatId: string, userId: string, message: string, filePath: string, fileType: string) => {
    try {
        const newMessage = new MessageModel({
            chat: chatId,
            sender: userId,
            message: message,
            filePath: filePath || '',  
            fileType: fileType || ''
        });
        await ChatModel.findByIdAndUpdate(chatId, { updatedAt: new Date() });
        await newMessage.save();

    

        console.log(newMessage, 'Message saved successfully');
        return newMessage;

    } catch (err) {
        console.error("Error while sending message", err);
        return null;
    }
};



const getMessage = async (chatId: string) => {
    try {
        let messages = await MessageModel.find({ chat: chatId }).sort({ createdAt: 1 });

        for (let message of messages) {
            if (message.filePath) {
                const getObjectParams = {
                    Bucket: bucket_name,
                    Key: message.filePath,
                };
                const getObjectCommand = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
                message.filePath = url;  
            }
        }
        
        return { messages };
    } catch (err) {
        console.error("Error while getting messages", err);
        return null;
    }
};

const createChat=async(user1:string,user2:string)=>{
    try {
        let chat = await ChatModel.findOne({
            participants: { $all: [user1, user2] }
        });
        if (chat) {
            return { success: true, chatId: chat._id }
        } else {
            chat = new ChatModel({
                participants: [user1, user2]
            });
            await chat.save();
            return { success: true, chatId: chat._id }
        }
    } catch (err) {
        console.error(`Error creating chats: ${err}`);
        return null;
    }
}


const deleteChat=async(chatId:string)=>{
try {
    const deleteMessage =await MessageModel.findByIdAndDelete({_id:chatId})
    return deleteMessage
} catch (err) {
    console.error("Error while deleting messages", err)
    return null;
}
}
const editMessage = async (messageId:string, newMessage:string) => {
    try {
      const updatedMessage = await MessageModel.findByIdAndUpdate(
        messageId,
        { message: newMessage },
        { new: true }
      );
      return updatedMessage;
    } catch (err) {
      console.error("Error while editing message", err);
      return null;
    }
  };
  const getChatList = async (userId: string) => {
    try {
      const chatlist = await ChatModel.aggregate([
        { $match: { participants: userId } },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "chat",
            as: 'messages'
          }
        },
        {
          $unwind: {
            path: "$messages",
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { "messages.createdAt": -1 } },  // Sort messages by createdAt in descending order
        {
          $group: {
            _id: "$_id",
            participants: { $first: "$participants" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            lastMessage: { $first: "$messages" }  // Get the most recent message
          }
        },
        { $sort: { "updatedAt": -1 } }  // Sort chats by updatedAt in descending order
      ]);
  
      console.log(chatlist, '===============chatlist');
      return { chatlist };
    } catch (err) {
      console.error("Error while getting list of chats", err);
      return null;
    }
  }
  
export default{
    sendMessage,
    getMessage,
    createChat,
    getChatList,
    deleteChat,
    editMessage
 }