import express from 'express';
import { Product } from '../shared/models/product-model';
import ProductModel from '../models/product-model.mongo';


export const addProduct = async (req: any, res: any) => {
    try {
        const { title, description, descriptionDetail, price, quantity, categoryId, imageUrl, isHide } = req.body;

        // if (!title || !description || !price || !quantity || !categoryId) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Vui lòng nhập đầy đủ thông tin (title, description, price, quantity, categoryId)"
        //     });
        // }

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

        return res.status(500).json({
            success: false,
            message: "Lỗi Server nội bộ",
            error: error.message
        });
    }
}
export const getAllProducts = async (req: any, res: any) => {
    try {
        const products = await ProductModel.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products', error });
    }
}

export const getProductById = async (req: any, res: any) => {
    try {
        const productId = req.params.id;
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch product', error });
    }
}

export const updateProduct = async (req: any, res: any) => {
    try {
        const productId = req.params.id;
        const updateData = req.body;
        const updatedProduct = await ProductModel.findByIdAndUpdate(productId, updateData, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product', error });
    }
}

export const deleteProduct = async (req: any, res: any) => {
    try {
        const productId = req.params.id;
        const deletedProduct = await ProductModel.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete product', error });
    }
}








