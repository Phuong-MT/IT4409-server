import mongoose, { Schema, Document } from "mongoose";
import { userTableName } from "./user-model.mongo";
import { triggerAsyncId } from "async_hooks";
export interface INotification extends Document {
    type: string;
    title: string;
    message: string;
    referenceId: string;
    userId: string;
    readBy: string[];
    
    createdAt: Date;
}
/*
// type: Order | Product| Payment
// 
//    referenceId: string     userId: string
// 
*/




const NotificationSchema = new Schema<INotification>({
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: String, required: true },
    userId: { type: String, ref: userTableName, required: true },
    readBy: [{ type: String, ref: userTableName, default: [] }], 
}, { 
    timestamps: true 
});

export default mongoose.model<INotification>("Notification", NotificationSchema);