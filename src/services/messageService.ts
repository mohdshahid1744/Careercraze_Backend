import messageRespository  from "../repository/messageRepository"

const sendMessageService = async ( chatId:string, userId:string, message:string, filePath:string, fileType:string ) => {
    try {
      console.log(chatId, userId, message);
      const newMessage = await messageRespository.sendMessage(chatId, userId, message, filePath, fileType);
      console.log(newMessage, 'Message saved successfully');
      return newMessage;
    } catch (err) {
      console.error("Error while saving message", err);
      return null;
    }
  };
const getMessage=async(chatId:string)=>{
    try {
        let response = await messageRespository.getMessage(chatId)
        return response
    } catch (err) {
        console.error("Error while getting message", err)
    }
}
const createChat=async(user1:string,user2:string)=>{
    try {
        const response=await messageRespository.createChat(user1,user2)
        return response
    } catch (err) {
        console.error("Error while creating chat", err)
    }
}
const getChatList=async(userId:string)=>{
    try {
        const response=await messageRespository.getChatList(userId)
        return response
    }catch (err) {
        console.error("Error while get chat", err)
    }
}
export default{
    sendMessageService,
    getMessage,
    createChat,
    getChatList
}