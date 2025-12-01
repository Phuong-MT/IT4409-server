import ProductModel from "../models/product-model.mongo";// Hãy đảm bảo đường dẫn import đúng

export const addProduct = async (req: any, res: any) => {
    try {
        const { title, description, descriptionDetail, price, quantity, categoryId, imageUrl, isHide } = req.body;

        if (!title || !description || !price || !quantity || !categoryId) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin (title, description, price, quantity, categoryId)"
            });
        }

        // 3. Tạo một instance mới của ProductModel
        const newProduct = new ProductModel({
            title,description,descriptionDetail,price,quantity,categoryId, imageUrl,isHide 
        });

        // 4. Lưu vào database
        const savedProduct = await newProduct.save();

        return res.status(201).json({
            success: true,
            message: "Thêm sản phẩm thành công",
            data: savedProduct
        });

    } catch (error: any) {
        console.error("Error adding product:", error);

        // Xử lý lỗi Validation của Mongoose (ví dụ sai kiểu dữ liệu)
        if (error.name === 'ValidationError') {
             return res.status(400).json({
                success: false,
                message: "Dữ liệu đầu vào không hợp lệ",
                error: error.message
            });
        }

        // Xử lý lỗi Server chung
        return res.status(500).json({
            success: false,
            message: "Lỗi Server nội bộ",
            error: error.message
        });
    }
}