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

export default OrderRouter;