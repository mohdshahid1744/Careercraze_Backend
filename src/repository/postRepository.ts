import PostModel from "../models/postModel";

const createPost=async(userId:string,image:string,description:string)=>{
    try {
        const post=await PostModel.create({
            userId,
            image,
            description
        })
        console.log('rep', post);
        return true
    } catch (error) {
        console.error("ERRROR",error);
        
    }
}
const getPost=async(userId:string)=>{
    try {
        const posts=await PostModel.find({userId:userId,isDeleted:{$ne:true}})
        return posts || []
    }  catch (err) {
        console.error(`Error fetching user post: ${err}`);
        return null;
    }
}
const likePost=async(userId:string,postId:string)=>{
    try {
        const updatedResult = await PostModel.updateOne({ _id: postId }, { $addToSet: { likes: { userId: userId } } })
        console.log("UPDATED",updatedResult);
        
        return true
    } catch (err) {
        console.error(`Error liking while posting: ${err}`);
        return null;
    }
}
const dislikePost=async(userId:string,postId:string)=>{
    try {
        const updatedResult=await PostModel.updateOne({_id:postId},{$pull:{likes:{userId:userId}}})
        console.log("Dislike",updatedResult);
        return true
        
    } catch (error) {
        console.error(`Error disliking the post:${error}`);
        return null;
    }
}
const commentPost=async(userId:string,postId:string,comment:string)=>{
    try {
        const updatedResult = await PostModel.updateOne({ _id: postId }, { $push: { comments: { userId: userId, message: comment } } })
        console.log("COMMENT",updatedResult);
        return true
    } catch (error) {
        console.error(`Error posying comment:${error}`);
        return null;
    }
}
const deletePost=async(postId:string)=>{
    try {
        const posts = await PostModel.updateOne({ _id: postId }, { $set: { isDeleted: true } })
            return { success: true }
    } catch (error) {
        console.error(`Error deleting post:${error}`);
        return null;
    }
}
const editPost = async (postId: string, description: string) => {
    try {
        const result = await PostModel.updateOne(
            { _id: postId }, 
            { $set: { description: description } }
        );

        console.log("EDITPOST Result:", result);

        if (result.modifiedCount === 1) {
            return { success: true };
        } else {
            return { success: false, error: "Post not found or no changes made." };
        }
    } catch (error) {
        console.error(`Error editing post: ${error}`);
        return { success: false, error: "Internal server error." };
    }
};
const reportPost=async(postId:string,userId:string,reason:string)=>{
    try {
        const post = await PostModel.findById(postId);
        
        if (!post) {
            console.error(`Post with ID ${postId} not found.`);
            return { success: false, message: 'Post not found' };
        }
        const response = await PostModel.updateOne({ _id: postId }, {
            $addToSet: { reported: { userId: userId, reason: reason } }
        })
        console.log("COMEONN",response);
        
        if (!response) {
            return { success: false }
        }
        return { success: true }
    } catch (error) {
        console.error(`Error reporting post: ${error}`);
        return null;
    }
}
export default{ 
    createPost,
    getPost,
    likePost,
    dislikePost,
    commentPost,
    deletePost,
    editPost,
    reportPost
}