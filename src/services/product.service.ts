import express from 'express';
import { Product } from '../shared/models/product-model';
import ProductModel from '../models/product-model.mongo';


export const createProduct = async (req: any, res: any) => {
    try {
        const producData = req.body;
        const {title, brand, description, specifications, categoryId} = producData;

        const existingProduct = await ProductModel.findOne({ title });
        if (existingProduct) {
            return res.status(400).json({ message: 'Product with this name already exists' });
        }
        
        const newProduct = new Product({ title, brand, description, specifications, categoryId   });
        const savedProduct = await ProductModel.create(newProduct);
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product', error });       
    }

}








