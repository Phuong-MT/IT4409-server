import NotificationModel from "../models/notification-model.mongo";
import { socket } from "../socket/socket";
import { registerGateway } from "../socket/socket.gateway";
import { NotificationTye } from "../shared/models/notification-model";
import { getIO } from "../utils/socket.config";
import mongoose from "mongoose";
class NotificationService {
    async pushNotification(
        type: NotificationTye,
        title: string,
        message: string,
        referenceId: string,
        userId: string
    ) {
        try {
            // 1. Lưu vào MongoDB
            const newNotification = {
                notificationType: type,
                title,
                message,
                referenceId,
                userId: new mongoose.Types.ObjectId(userId),
                readBy: [],
            };
            const NotificationSaved = await NotificationModel.create(
                newNotification
            );
            getIO()
                ?.of("/admin")
                .emit("admin:new-notification", newNotification);

            return NotificationSaved;
        } catch (error) {
            console.error("❌ Notification Error:", error);
            // Không throw error để tránh làm lỗi quy trình chính (như tạo đơn hàng)
        }
    }

    /**
     * Hàm đánh dấu đã đọc (Logic mảng readBy)
     */
    async markAsRead(notificationId: string, adminId: string) {
        return await NotificationModel.findByIdAndUpdate(
            notificationId,
            { $addToSet: { readBy: adminId } }, // $addToSet giúp không bị trùng ID
            { new: true }
        );
    }
}

export const notificationService = new NotificationService();
