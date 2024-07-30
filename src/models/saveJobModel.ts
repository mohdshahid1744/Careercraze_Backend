import mongoose, { Document, Schema, Types } from "mongoose";
import cron from "node-cron";
import dotenv from 'dotenv';
dotenv.config()

const collection:any=process.env.Mongo_URL

export interface JOB extends Document {
    jobId: Types.ObjectId;
    userId: Types.ObjectId;
    jobrole: string;
    companyname: string;
    joblocation: string;
    companylogo: string;
    createdAt: Date;
}

const SaveJobSchema: Schema<JOB> = new Schema({
    jobId: {
        type: Schema.Types.ObjectId,
        ref: 'Jobs',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    jobrole: {
        type: String,
        required: true
    },
    companyname: {
        type: String,
    },
    joblocation: {
        type: String,
        required: true
    },
    companylogo: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const SaveJobModel = mongoose.model<JOB>("savedJobs", SaveJobSchema);

async function createOrUpdateIndex() {
    try {
        await mongoose.connect(collection);

        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

createOrUpdateIndex();

cron.schedule("* * * * *", async () => {  
    const expirationTime = new Date(Date.now() - 60 * 1000);  
    await SaveJobModel.deleteMany({ createdAt: { $lt: expirationTime } });
    console.log('Expired jobs deleted');
});

export default SaveJobModel;
