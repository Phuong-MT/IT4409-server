// src/schemas/register.schema.ts

import * as yup from 'yup';

export const registerSchema = yup.object({
    // Đổi 'name' thành 'username' để khớp với controller của bạn
    username: yup 
        .string()
        .trim()
        .min(2, 'Username must be at least 2 characters')
        .max(50, 'Username must be at most 50 characters')
        .required('Username is required'),
        
    email: yup
        .string()
        .trim()
        .lowercase()
        .email('Invalid email address')
        .required('Email is required'),
        
    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be at most 128 characters')
        .required('Password is required'),
        
    // Bạn nên bỏ confirmPassword khỏi schema nếu bạn không dùng nó
    // Hoặc giữ lại nếu client bắt buộc gửi nó để kiểm tra
    // confirmPassword: yup 
    //     .string()
    //     .oneOf([yup.ref('password')], 'Passwords must match')
    //     .required('Confirm password is required'),
        
    phoneNumber: yup
        .string()
        .matches(/^\d{10,15}$/, 'Invalid phone number format') // Ví dụ: 10-15 chữ số
        .required('Phone number is required'),
        
    dateOfBirth: yup
        .date()
        .max(new Date(), 'Date of birth cannot be in the future')
        .required('Date of birth is required'),
        
    address: yup // Trường không bắt buộc
        .array(yup.string())
        .optional(),
        
}).required();