import express from 'express';
import { Category } from '../shared/models/category-model';
import CategoryModel from '../models/category-model.mongo';

export const createCategory = async (req: any, res: any) => {
    try {
        const categoryData = req.body;
        const {name, description} = categoryData;
        
        const existingCategory = await CategoryModel.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }
        const newCategory = new Category({ name, description });
        const savedCategory = await CategoryModel.create(newCategory);
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create category', error });       
    }
}


export const getAllCategories = async (req: any, res: any) => {
    try {
        const categories = await CategoryModel.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch categories', error });
    }
}

export const getCategoryById = async (req: any, res: any) => {
    try {
        const categoryId = req.params.id;
        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch category', error });
    }
}

export const updateCategory = async (req: any, res: any) => {
    try {
        const categoryId = req.params.id;
        const updateData = req.body;
        const updatedCategory = await CategoryModel.findByIdAndUpdate(categoryId, updateData, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update category', error });
    }
}

export const deleteCategory = async (req: any, res: any) => {
    try {
        const categoryId = req.params.id;
        const deletedCategory = await CategoryModel.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete category', error });
    }
}   
