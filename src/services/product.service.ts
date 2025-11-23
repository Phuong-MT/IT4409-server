import express from 'express';
import { Product } from '../shared/models/product-model';
import ProductModel from '../models/product-model.mongo';


export const createProduct = async (req: any, res: any) => {
    try {
        const producData = req.body;
        const {name, description, price, categoryId, stock} = producData;

        const existingProduct = await ProductModel.findOne({ name });
        if (existingProduct) {
            return res.status(400).json({ message: 'Product with this name already exists' });
        }
        
        const newProduct = new Product({ name, description, price, categoryId, stock });
        const savedProduct = await ProductModel.create(newProduct);
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create product', error });       
    }

}







