import express from 'express';
import { Product } from '../shared/models/product-model';
import ProductModel from '../models/product-model.mongo';


export const createProduct = async (req: any, res: any) => {
    try {
        const producData = req.body;
        const {title, brand, description, specifications, categoryId} = producData;

        // const existingProduct = await ProductModel.findOne({ title });
        // if (existingProduct) {
        //     return res.status(400).json({ message: 'Product with this name already exists' });
        // }
        
        const savedProduct = await ProductModel.create({
            title: title,
            brand: brand,
            description: description,
            specifications: specifications,
            categoryId: categoryId
        });
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product', error });       
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






