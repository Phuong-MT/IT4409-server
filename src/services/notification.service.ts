import NotificationModel from "../models/notification-model.mongo";
import { socket } from "../socket/socket";

class NotificationService {
    
    async pushNotification(type: string, title: string, message: string, data: any = {}) {
        try {
            // 1. Lưu vào MongoDB
            const newNotif = await NotificationModel.create({
                type,
                title,
                message,
                data,
                readBy: []
            });

            // 2. Bắn Socket ngay lập tức
            // Dùng hàm emitToRoom bạn đã có trong file socket.ts
            socket.emitToRoom(
                "admin:notification", // Tên sự kiện client sẽ nghe
                newNotif,             // Dữ liệu gửi đi
                "/admin",             // Tên Room (Khớp với gateway admin:join)
                "/admin"              // Namespace
            );
            
            return newNotif;
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