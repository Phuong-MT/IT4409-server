import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    type: string;
    title: string;
    message: string;
    data: any;
    readBy: mongoose.Types.ObjectId[]; 
    createdAt: Date;
}

const NotificationSchema = new Schema({
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Object, default: {} },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }], 
}, { 
    timestamps: true 
});

export default mongoose.model<INotification>("Notification", NotificationSchema);