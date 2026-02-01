import * as yup from 'yup';

export const updateUserSchema = yup.object({
  firstName: yup.string().min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().min(2, 'Last name must be at least 2 characters'),
  
  email: yup.string().email('Invalid email format'),
  
  password: yup.string().min(8, 'Password must be at least 8 characters'),
  
  contactNumber: yup.string(),
  birthDate: yup.date().nullable(),
  
  roles: yup.array().of(
    yup.string().oneOf(['superadmin', 'admin', 'curator', 'editor', 'scheduler', 'auditor', 'donor', 'guest'])
  ),
  status: yup.string().oneOf(['active', 'banned', 'pending'])
});