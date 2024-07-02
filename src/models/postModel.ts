import mongoose, { Document, Schema } from "mongoose";

interface Comment {
    userId: string;
    message: string;
    createdAt: Date;
}

interface Like {
    userId: string;
    createdAt: Date;
}

interface Report {
    userId: string;
    reason: string
}


export interface Post extends Document {
    userId?: string;
    image: string;
    description?: string;
    comments?: Comment[];
    likes?: Like[];
    reported?: Report[];
    isDeleted: boolean;
    createdAt: Date;
}


const PostSchema: Schema<Post> = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    image: {
        type: String, required: true
    },
    description: {
        type: String, required: true
    },
    comments: [
        {
            userId: {
                type: Schema.Types.ObjectId, ref: "User", required: true
            },
            message: {
                type: String, required: true
            },
            createdAt: {
                type: Date, default: Date.now
            }
        }
    ],
    likes: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User", required: true
            },
            createdAt: {
                type: Date, default: Date.now
            }
        }
    ],
    reported: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User", required: true
            },
            reason: {
                type: String, required: true
            },
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false,
    },
    createdAt: { type: Date, default: Date.now }
});

const PostModel = mongoose.model<Post>("Post", PostSchema);

export default PostModel;