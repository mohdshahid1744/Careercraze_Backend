
import postRepository from "../repository/postRepository";
import { Request,Response } from "express";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv'
import sharp from 'sharp';
import crypto from 'crypto'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import PostModel from "../models/postModel";
import postService from "../services/postService";
dotenv.config()

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

const createPost = async (req: Request, res: Response) => {
    const { description } = req.body;
    const { userId } = req.params;
  
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Image is required' });
      }
  
      const imageName = randomImageName();
      console.log('in post create', req);
  
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 1920, height: 1080, fit: 'cover' })
        .toBuffer();
  
      const params = {
        Bucket: bucket_name,
        Key: imageName,
        Body: buffer,
        ContentType: req.file.mimetype,
      };
  
      const command = new PutObjectCommand(params);
      await s3.send(command);
  
      const response = await postRepository.createPost(userId, imageName, description);
      console.log(response, 'response');
  
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
const getUserPost=async(req:Request,res:Response)=>{
    const {userId}=req.params
    try {
       const posts=await postRepository.getPost(userId)
       if (posts) {
        for (let post of posts) {
            const getObjectParams = {
                Bucket: bucket_name,
                Key: post.image,
            }

            const getObjectCommand = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
            post.image = url
        }
    }
    const response = {
        posts: posts
    };
    res.status(200).json(response);
    } catch (error) {
        console.error('Error getting post:', error);
        res.status(500).json({ message: 'Internal server error' }); 
    }
}
const getAllPost=async(req:Request,res:Response)=>{
    try {
        let posts = await PostModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 })
        for (let post of posts) {
            const getObjectParams = {
                Bucket: bucket_name,
                Key: post.image,
            }

            const getObjectCommand = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
            post.image = url
        }
        const response = {
            posts: posts
        };
        res.status(200).json(response);
    }catch (error) {
        console.error('Error getting post:', error);
        res.status(500).json({ message: 'Internal server error' }); 
    }
}
const getAllComments=async(req:Request,res:Response)=>{
    const {postId}=req.params
    try {
        let posts=await PostModel.find({_id:postId},{comments:1})
        console.log("ASDASSD",posts);
        res.status(200).json(posts);
    } catch (error) {
        console.error("ERROR",error);
        
    }
}
const likePost = async (req: Request, res: Response) => {
    const { userId, postId } = req.body;

    if (!userId || !postId) {
        return res.status(400).json({ error: 'userId and postId are required in the request body' });
    }

    try {
        const result = await postRepository.likePost(userId, postId);
        if (result === null) {
            return res.status(500).json({ error: 'Error liking post' });
        }
        res.status(200).json({ message: 'Post liked successfully' });
    } catch (error) {
        console.error(`Error liking post: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const dislikePost=async(req:Request,res:Response)=>{
    const {userId,postId}=req.body
    if (!userId || !postId) {
        return res.status(400).json({ error: 'userId and postId are required in the request body' });
    }
    try {
        const result=await postRepository.dislikePost(userId,postId)
        res.status(200).json({message:'Post disliked'})
    } catch (error) {
        console.error(`Error disliking post: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
}
const commentPost=async(req:Request,res:Response)=>{
    const {userId,postId,comment,username}=req.body
    if (!userId || !postId) {
        return res.status(400).json({ error: 'userId and postId are required in the request body' });
    }
    try {
        const result=await postRepository.commentPost(userId,postId,comment,username)
        res.status(200).json({message:'Comment added successfully',result})
    } catch (error) {
        console.error(`Error adding comment: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const replyComment=async(req:Request,res:Response)=>{
    const {userId,postId,comment,parentCommentId,username}=req.body
    if (!userId || !postId || !parentCommentId) {
        return res.status(400).json({ error: 'userId , postId and parentCommentId are required in the request body' });
    }
    try {
        const result=await postRepository.replyComment(userId,postId,comment,parentCommentId,username)
        res.status(200).json({message:'Comment added successfully',result})
    } catch (error) {
        console.error(`Error adding comment: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
}
const deletePost=async(req:Request,res:Response)=>{
    try {
       const {postId}=req.body
       let response = await postService.deletePost(postId) 
       res.status(200).json({response})
    } catch (error) {
     
        console.error(`Error deleting post: ${error}`);
        res.status(500).json({ error: 'Internal server error' });   
    }
}
const editPost=async(req:Request,res:Response)=>{
    const {postId}=req.params
    const {description}=req.body
    try {
        let response = await postService.editPost(postId,description) 
        res.status(200).json({response})  
    } catch (error) {
        console.error(`Error editingg post: ${error}`);
        res.status(500).json({ error: 'Internal server error' });    
    }
}
const reportPost=async(req:Request,res:Response)=>{
    try {
        const {userId,postId,reason}=req.body
        
        const response=await postService.reportPost(postId,userId,reason)
        console.log("READFDS",response);
        
        res.status(200).json({response}) 
    } catch (error) {
        console.error(`Error reporting post: ${error}`);
        res.status(500).json({ error: 'Internal server error' });    
    }
}
const deleteComments=async(req:Request,res:Response)=>{
    try {
        const {postId,commentId}=req.body
        const response=await postService.deleteComments(postId,commentId)
        res.status(200).json({response}) 
        
    }catch (error) {
        console.error(`Error deleting comment: ${error}`);
        res.status(500).json({ error: 'Internal server error' });    
    }
}
export default{
    createPost,
    getUserPost,
    getAllPost,
    likePost,
    dislikePost,
    commentPost,
    getAllComments,
    deletePost,
    editPost,
    reportPost,
    deleteComments,
    replyComment
}