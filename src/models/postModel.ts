import mongoose, { Document, Schema } from "mongoose";

interface Comment {
    userId: string;
    message: string;
    createdAt: Date;
    username:string;
    replies?: Comment[]; 
}


interface Like {
    userId: string;
    createdAt: Date;
}

interface Report {
    userId: string;
    reason: string
}
interface Reply extends Document {
    userId: mongoose.Types.ObjectId;
    message: string;
    username:string;
    createdAt: Date;
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

const ReplySchema: Schema<Reply> = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    username:{
        type:String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
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
            username:{
                type:String
            },
            createdAt: {
                type: Date, default: Date.now
            },
            replies: [ReplySchema]
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