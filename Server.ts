import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db from './src/FrameWork/Database/db';
import userRoute from './src/FrameWork/Routes/userRoute';
import recruiterRoute from './src/FrameWork/Routes/recruiterRoute'
import { Server as SocketIOServer } from "socket.io";
import configureSocket from './src/utils/Socket'



dotenv.config();
const app = express();
const port = 3001;

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: 'https://careercraze.site',
    credentials: true
  },
});
app.use(cors({
  origin: 'https://careercraze.site',
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.use('/', userRoute);
app.use('/recruiter', recruiterRoute);

configureSocket(io);
db.once('open', () => {
  
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
