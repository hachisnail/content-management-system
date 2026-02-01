import * as yup from 'yup';

export const donorIntakeSchema = yup.object({
  // --- Donor Details (Required if Guest) ---
  firstName: yup.string()
    .min(2, 'First name is too short')
    .required('First name is required'),
  lastName: yup.string()
    .min(2, 'Last name is too short')
    .required('Last name is required'),
  email: yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  contactNumber: yup.string()
    .matches(/^[0-9+\-\s()]*$/, 'Invalid phone number format')
    .nullable(),

  // --- Item Details ---
  itemName: yup.string()
    .min(3, 'Item name must be at least 3 characters')
    .max(100, 'Item name is too long')
    .required('Item name is required'),
  
  description: yup.string()
    .min(20, 'Please provide a detailed description (min 20 chars)')
    .required('Description is required'),

  // Optional: Era or Estimated Year
  estimatedYear: yup.number()
    .min(0, 'Invalid year')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .nullable()
    .typeError('Year must be a number'),
    
  condition: yup.string()
    .oneOf(['excellent', 'good', 'fair', 'poor'], 'Invalid condition')
    .default('good'),
});