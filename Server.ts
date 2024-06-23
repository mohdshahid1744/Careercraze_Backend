import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db from './src/FrameWork/Database/db';
import userRoute from './src/FrameWork/Routes/userRoute';
import recruiterRoute from './src/FrameWork/Routes/recruiterRoute'

dotenv.config();
const app = express();
const port = 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// app.use((req, res, next) => {
//   console.log("Incoming request cookies:", req.cookies);
//   next();
// });
// app.use((req, res, next) => {
//   console.log("Incoming request headers:", req.headers);
//   next();
// });


app.use('/', userRoute);
app.use('/recruiter', recruiterRoute);

db.once('open', () => {
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
