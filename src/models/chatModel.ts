import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
    participants: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatSchema: Schema<IChat> = new Schema({
    participants: [
        { type: String, required: true }
    ],
}, { timestamps: true });

const ChatModel = mongoose.model<IChat>("Chat", ChatSchema);

export default ChatModel;