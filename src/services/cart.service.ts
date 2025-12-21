import mongoose from "mongoose";
import CartModel from "../models/cart-model.mongo";

// 1. Thêm sản phẩm vào giỏ hàng
export const addToCart = async (req: any, res: any) => {
    try {
        const userId = req.user.id; 
        const { productId, quantity } = req.body;

        // Validate quantity
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than 0" });
        }

        const updatedCart = await CartModel.findOneAndUpdate(
            {
                userId: userId,
                productId: productId
            },
            {
                $inc: { quantity: quantity } // Cộng dồn số lượng
            },
            {
                new: true,    // Trả về document mới
                upsert: true, // Nếu chưa có thì tạo mới
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({ message: "Product added to cart", data: updatedCart });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add product to cart', error });
    }
}

// 2. Lấy danh sách giỏ hàng của User
export const getCart = async (req: any, res: any) => {
  try {
    const userId = req.user.id; 
    console.log(userId);
    const cartItems = await CartModel.find({ userId: userId })
      .populate({
        path: "productId",
        select: "title variants "
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: cartItems
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch cart",
      error
    });
  }
};

// 3. Cập nhật số lượng (Update Quantity)
export const updateQuantity = async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        if ( !mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const userObjId = new mongoose.Types.ObjectId(userId);
        const productObjId = new mongoose.Types.ObjectId(productId);

        // Trường hợp 1: Số lượng <= 0 -> Xóa sản phẩm
        if (quantity <= 0) {
            const deletedItem = await CartModel.findOneAndDelete({ userId: userObjId, productId: productObjId });
            
            if (!deletedItem) {
                return res.status(404).json({ message: 'Item not found in cart' });
            }
            return res.status(200).json({ message: "Item removed from cart because quantity is 0" });
        }

        // Trường hợp 2: Update số lượng mới
        const updatedItem = await CartModel.findOneAndUpdate(
            { userId: userObjId, productId: productObjId },
            { quantity: quantity },
            { new: true }
        ).lean();

        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        res.status(200).json({ message: 'Cart updated successfully', data: updatedItem });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update cart', error });
    }
}

// 4. Xóa hẳn sản phẩm khỏi giỏ
export const removeItem = async (req: any, res: any) => {
    try {
        const {  userId, productId } = req.body;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const result = await CartModel.deleteOne({
            userId: new mongoose.Types.ObjectId(userId),
            productId: new mongoose.Types.ObjectId(productId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        res.status(200).json({ message: "Item removed from cart successfully" });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove item from cart', error });
    }
}