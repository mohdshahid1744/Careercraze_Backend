
import postRepository from "../repository/postRepository";
const deletePost=async(postId:string)=>{
    try {
        let response = await postRepository.deletePost(postId)
        return response
    } catch (err) {
        console.error(`Error delete post: ${err}`);
        return null;
    }
}
const editPost=async(postId:string,description:string)=>{
    try {
        let response = await postRepository.editPost(postId,description)
        return response
    } catch (err) {
        console.error(`Error edit posts: ${err}`);
        return null;
    }
}
const reportPost=async(reason:string,postId:string,userId:string)=>{
    try {
        const response=await postRepository.reportPost(reason,postId,userId)
        
        
        return response
    } catch (err) {
        console.error(`Error report posts: ${err}`);
        return null;
    }
}
const deleteComments=async(postId:string,commentId:string)=>{
    try {
        let response = await postRepository.deleteComments(postId, commentId)
        return response
    } catch (err) {
        console.error(`Error post comment deletig: ${err}`);
        return null;
    }
}
const getChartDetails= async (year: number, month: number) => {
    try {
        let response = await postRepository.getChartDetails(year, month)
        return response
    } catch (err) {
        throw new Error(`Failed to sign up: ${err}`);
    }
}
export default {
    deletePost,
    editPost,
    reportPost,
    deleteComments,
    getChartDetails
}
