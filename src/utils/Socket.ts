import { Server, Socket } from "socket.io";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();
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
const onlineUsers = new Map<string, string>();
const configureSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("connected to socket.io");

    socket.on("setup", (user: any) => {
      socket.join(user.UserId);
      onlineUsers.set(user.UserId, socket.id)
      io.emit('user status', Array.from(onlineUsers.keys()));
      socket.emit("connected");
    });
    socket.on("disconnect", () => {
      onlineUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('user status', Array.from(onlineUsers.keys()));
        }
      });
    });

    socket.on('join chat', (room) => {
      socket.join(room);
      console.log("Joined room:", room);
    });
    socket.on("logout", (userId: string) => {
      onlineUsers.delete(userId);
      io.emit('user status', Array.from(onlineUsers.keys()));
    });

    socket.on('new message', async (newMessageReceived) => {
      console.log("RECEIVED", newMessageReceived);
      
      if (!newMessageReceived || !newMessageReceived.sender) {
          console.error("Invalid new message structure:", newMessageReceived);
          return;
      }
      
      if (newMessageReceived.filePath) {
          const getObjectParams = {
              Bucket: bucket_name,
              Key: newMessageReceived.filePath
          };
          const getObjectCommand = new GetObjectCommand(getObjectParams);
          const signedUrl = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });
          
          newMessageReceived.filePath = signedUrl;   
          console.log("ASDASDASDASDASDASDASDASDASD",signedUrl);
          
      }
      socket.to(newMessageReceived.chat).emit("message received", newMessageReceived);
      
  });
  
  
  
    
    

    socket.on("delete message", (messageId, chatId) => {
      console.log("Deleting message:", messageId);
      console.log("Deleting chat:", chatId);
      socket.to(chatId).emit("message deleted", messageId);
    });
    socket.on("edit message", (editedMessage) => {
      console.log("Editing message:", editedMessage);

      if (!editedMessage || !editedMessage.messageId || !editedMessage.newMessage || !editedMessage.chatId) {
        console.error("Invalid edited message structure:", editedMessage);
        return;
      }
      socket.to(editedMessage.chatId).emit("message edited", editedMessage);
    });


    socket.on("typing", (room: string) => {
      socket.in(room).emit("typing");
    });

    socket.on("stop typing", (room: string) => {
      socket.in(room).emit("stop typing");
    });

    socket.on('callUser', ({ userToCall, from, offer, fromId }) => {
      console.log(`Incoming call to ${userToCall} from ${from}`);
      const userSocketId = onlineUsers.get(userToCall);
      
      
      if (userSocketId) {
          io.to(userSocketId).emit('incomingCall', { from, offer, fromId });
      }
  });
  socket.on('signal', (data) => {
    const { userId, type, candidate, answer, context } = data;
    console.log("Received signal:",  context);
    
    if (context === 'webRTC') {
      console.log("Handling WebRTC signal for user:", userId);
      const userSocketId = onlineUsers.get(userId);
      
      if (userSocketId) {
        io.to(userSocketId).emit('signal', { type, candidate, answer });
      }
    }
  });
  
  socket.on('callAccepted', ({ userId, answer, context }) => {
    if (context
        == 'webRTC') {
        const userSocketId = onlineUsers.get(userId) || ''
        console.log(`Sending call accepted signal to ${userId},${userSocketId}`);
        io.to(userSocketId).emit('callAcceptedSignal', { answer });
    }
});

socket.on('callEnded', (guestId) => {
  let userSocketId = onlineUsers.get(guestId) || ''
  io.to(userSocketId).emit('callEndedSignal');
})

    socket.off("setup", (user: any) => {
      console.log("User Disconnected");
      socket.leave(user.UserId);
    });
  });
};

export default configureSocket;
