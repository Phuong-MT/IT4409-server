import express from 'express';
import mongoose from 'mongoose';
import { Product } from '../shared/models/product-model';
import CategoryModel from '../models/category-model.mongo';
import ProductModel from '../models/product-model.mongo';
import { Contacts } from '../shared/contacts';
const STATUS_EVALUATION = Contacts.Status.Evaluation;
export const addProduct = async (req: any, res: any) => {
    try {
        const {title, brand, description, descriptionDetail,
               specifications, variants, categoryId, isHide, rating} = req.body;
        
        const category = await CategoryModel.findById(categoryId);
        if(!category){
            res.status(400).json({
                success: false,
                message: "Category does not exist"
            })
        }
        // 3. Tạo một instance mới của ProductModel
        const newProduct = new ProductModel({
            title, brand, description, descriptionDetail,
            specifications, variants, categoryId, isHide, rating
        });

        // 4. Lưu vào database
        const savedProduct = await newProduct.save();

        return res.status(201).json({
            success: true,
            message: "Add product successfully",
            data: savedProduct
        });

    } catch (error: any) {
        if (error.keyPattern && error.keyPattern['variants.sku']) {
                return res.status(409).json({ // 409 Conflict
                    success: false,
                    message: "SKU already exists in another product variant."
                });
        }
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

export const getAllProducts = async (req: any, res: any) => {
    try {
        const products = await ProductModel.find({isHide: STATUS_EVALUATION.PUBLIC}).lean();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products', error });
    }
}

export const getProductById = async (req: any, res: any) => {
    try {
        const productId = req.params.id;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid product id" });
        }
        const product = await ProductModel.findOne(
            {
                _id: productId,
                isHide: STATUS_EVALUATION.PUBLIC
            }).lean();
            
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

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const updateData = req.body;
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            updateData,
            {
                new: true,
                runValidators: true,
                context: "query",
            }
        ).lean();

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product', error });
    }
}

export const changeProductStatus = async (req: any, res: any) => {
    try {
        const productId = req.params.id;
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const { to } = req.body;
        
        const allowedStatuses = [
            Contacts.Status.Evaluation.CREATE,
            Contacts.Status.Evaluation.PUBLIC,
            Contacts.Status.Evaluation.HIDE
        ];
        const reverseStatus = (statusGroup: Record<string, number>) =>
            Object.fromEntries(Object.entries(statusGroup).map(([k, v]) => [v, k]));


        const EvaluationStatusName = reverseStatus(Contacts.Status.Evaluation);
        // Kiểm tra "to" có hợp lệ không
        if (!allowedStatuses.includes(to)) {
            return res.status(400).json({
                message: "Invalid status value",
                allowed: allowedStatuses
            });
        }

        const status = EvaluationStatusName[to];

        // Cập nhật trực tiếp
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { isHide: to },
            { new: true, runValidators: true, context: 'query' }
        ).lean();
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: `Change status to ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change status', error });
    }
}








