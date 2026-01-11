import express from "express";
import { auth } from "../middlewares/auth";
import { verifyRole } from "../middlewares/verifyRole";
import { UserRole } from "../shared/models/user-model";
import { Router } from "express";
import { orderServices } from "../services/order.service";

const OrderRouter = Router();

/**
 * POST /api/orders
 * Tạo đơn hàng từ giỏ hàng hiện tại
 */

/**
 * POST /api/orders
 * Tạo đơn hàng mới từ giỏ hàng hiện tại của người dùng
 * 
 * Yêu cầu:
 *  - Người dùng đã đăng nhập (auth middleware)
 *  - Role: USER
 *  - Body phải có toAddress (địa chỉ giao hàng)
 */
OrderRouter.post("/orders",auth, verifyRole([UserRole.USER]), async (req: any, res: any) => {
    try {
        const userId = req.user.id; 
        const { toAddress, note } = req.body;

        if (!toAddress) {
            return res.status(400).json({ message: "Shipping address (toAddress) is required" });
        }

        // 3. Gọi Service xử lý
        const newOrder = await orderServices.createOrderFromCart(userId, toAddress, note);

        // 4. Trả về kết quả thành công
        return res.status(201).json({
            message: "Order placed successfully",
            data: newOrder
        });

    } catch (error: any) {
        console.error("Order Error:", error.message);

        // 5. Xử lý lỗi từ Service ném ra
        if (error.message === "CART_EMPTY") {
            return res.status(400).json({ message: "Your cart is empty" });
        }
        if (error.message && error.message.startsWith("PRODUCT_NOT_FOUND")) {
            return res.status(404).json({ message: "One of the products in your cart no longer exists" });
        }

        // Lỗi server không xác định
        return res.status(500).json({ 
            message: "Failed to create order", 
            error: error.message 
        });
    }
});

OrderRouter.get(
    "/orders/all", 
    auth, 
    verifyRole([UserRole.USER]), // Chỉ Admin mới được xem hết
    async (req: any, res: any) => {
        try {
            // Lấy tham số từ Query String (URL)
            // Ví dụ: ?page=2&limit=5&status=DONE
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string; // Có thể undefined
            const status = req.query.status as string; // Có thể undefined

            // Gọi Service
            const result = await orderServices.getAllOrders(page, limit, search, status);

            return res.status(200).json({
                message: "Get list orders successfully",
                data: result
            });

        } catch (error: any) {
            console.error("Get All Orders Error:", error);
            return res.status(500).json({ 
                message: "Failed to fetch orders", 
                error: error.message 
            });
        }
    }
);

// OrderRouter.get("/orders/:id", auth, async (req: any, res: any) => {
//     try {
//         const { id } = req.params;
//         const result = await orderServices.orderInfoWidthListProductDetail(id);

//         if (!result || result.length === 0) {
//             return res.status(404).json({ message: "Order not found" });
//         }

//         return res.status(200).json({
//             message: "Get order detail successfully",
//             data: result[0]
//         });
//     } catch (error: any) {
//         return res.status(500).json({ message: "Error", error: error.message });
//     }
// });
OrderRouter.get("/orders/:id", auth, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // GỌI HÀM MỚI (Thay vì orderInfoWidthListProductDetail)
        const order = await orderServices.getOrderById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // --- Logic phụ: Kiểm tra quyền xem đơn hàng ---
        // Nếu không phải Admin VÀ không phải chủ đơn hàng -> Chặn
        const user = req.user;
        if (!verifyRole([UserRole.ADMIN]) && order.userId.toString() !== user.id) {
             return res.status(403).json({ message: "Forbidden: Not your order" });
        }
        // ----------------------------------------------

        return res.status(200).json({
            message: "Get order detail successfully",
            data: order // Trả về object đơn hàng (không nằm trong mảng)
        });

    } catch (error: any) {
        return res.status(500).json({ message: "Error", error: error.message });
    }
});

export default OrderRouter;