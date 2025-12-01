// src/schemas/product.schema.ts

import * as yup from 'yup';

export const productSchema = yup.object({
    title: yup
        .string()
        .trim()
        .max(255, 'Title must be at most 255 characters')
        .required('Title is required'),

    description: yup
        .string()
        .trim()
        .required('Description is required'),

    descriptionDetail: yup
        .string()
        .trim()
        .required('Detail description is required'),

    price: yup
        .number()
        .typeError('Price must be a number') // Bắt lỗi nếu gửi string không phải số
        .min(0, 'Price must be greater than or equal to 0')
        .required('Price is required'),

    quantity: yup
        .number()
        .typeError('Quantity must be a number')
        .integer('Quantity must be an integer') // Số lượng không được lẻ
        .min(0, 'Quantity cannot be negative')
        .required('Quantity is required'),

    categoryId: yup
        .string()
        // Regex kiểm tra định dạng ObjectId của MongoDB (24 ký tự hex)
        .matches(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID format'),

    isHide: yup
        .number()
        .integer()
        .optional(),

    imageUrl: yup
        .array()
        .of(yup.string().trim().url('Image URL must be a valid URL')) 
        .optional(),
        
}).required();