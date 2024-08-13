import mongoose, { Document, Schema } from "mongoose";

export interface Applicant {
    userId: string;
    name: string;
    email: string;
    mobile: string;
    cvPath: string;
    status: string;
    createdAt: Date;
}
export interface JOB extends Document {
    jobrole: string;
    companyname: string;
    minexperience: string;
    maxexperience: string;
    minsalary: string;
    maxsalary: string;
    joblocation: string;
    emptype: string
    skills: string[];
    description: string;
    companylogo: string;
    applicants: Applicant[];
    recruiterId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const JobSchema: Schema<JOB> = new Schema({
    jobrole: {
        type: String,
        required: true
    },
    companyname: {
        type: String,
    },
    minexperience: {
        type: String,
        required: true
    },
    maxexperience: {
        type: String,
        required: true

    },
    minsalary: {
        type: String,
        required: true
    },
    maxsalary: {
        type: String,
        required: true
    },
    joblocation: {
        type: String,
        required: true
    },
    emptype: {
        type: String,
        required: true,
    },
    skills: [{
        type: String,
        required: false
    }],
    companylogo: {
        type: String,
    },
    description: {
        type: String,
        required: true,
    },
    applicants: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
        },
        email: {
            type: String
        },
        mobile: {
            type: String
        },
        cv: {
            type: String,
        },
        status: {
            type: String,
            default:'Applied'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    recruiterId: {
        type: Schema.Types.ObjectId,
        ref: "Recruiter",
        required: true
    },
    createdAt: { type: Date, default: Date.now }
})

const JobModel = mongoose.model<JOB>("Jobs", JobSchema);

export default JobModel;