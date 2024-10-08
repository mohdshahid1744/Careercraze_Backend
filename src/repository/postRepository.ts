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
const commentPost=async(userId:string,postId:string,comment:string,username:string)=>{
    try {
        const updatedResult = await PostModel.updateOne({ _id: postId }, { $push: { comments: { userId: userId, message: comment,username } } })
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

const deleteComments=async(postId:string,commentId:string)=>{
    try {
        const response = await PostModel.updateOne({ _id: postId }, {
            $pull: { comments: { _id: commentId } }
        })
        if (!response) {
            return { success: false }
        }
        return { success: true }
    } catch (error) {
        console.error(`Error deleting comment post: ${error}`);
        return null;
    }
}

const replyComment=async(userId: string, postId: string, comment: string, parentCommentId?: string,username?:string)=>{
    try {
        const updatedResult = await PostModel.updateOne(
            { _id: postId, "comments._id": parentCommentId },
            { $push: { "comments.$.replies": { userId, message: comment,username } } }
        );
        console.log("REPLY", updatedResult);
        return true
    } catch (error) {
        console.error(`Error posting reply comment:${error}`);
        return null;
    }
}
const getChartDetails= async (currentYear: number, month: number) => {
    try {
        const userStats = await PostModel.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $year: "$createdAt" }, currentYear]
                    },
                    isDeleted: {
                        $ne: true
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.month": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    count: 1
                }
            }

        ])
        const result = Array.from({ length: month + 1 }, (_, i) => ({
            month: i + 1,
            count: 0
        }));
        userStats.forEach(stat => {
            const index = result.findIndex(r => r.month == stat.month);
            if (index !== -1) {
                result[index].count = stat.count;
            }
        });
        let count = await PostModel.find({ isDeleted: { $ne: true } }).countDocuments();
        return { result, count }
    } catch (err) {
        console.error(`Error fetching chart: ${err}`);
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
    reportPost,
    deleteComments,
    replyComment,
    getChartDetails
}