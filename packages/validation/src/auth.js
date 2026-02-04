import * as yup from 'yup';

// 1. Login Form
export const loginSchema = yup.object({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string()
    .required('Password is required'),
});

// 2. Admin Invite Form
export const inviteUserSchema = yup.object({
  email: yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  firstName: yup.string()
    .min(2, 'First name is too short')
    .required('First name is required'),
  lastName: yup.string()
    .min(2, 'Last name is too short')
    .required('Last name is required'),
  roles: yup.array()
    .of(yup.string()) // Role validation logic handled by backend/UI options usually, but can be strict here if enum known
    .min(1, 'At least one role is required')
    .required('Roles are required'),
});

// 3. Complete Registration Form
export const completeRegistrationSchema = yup.object({
  token: yup.string().required('Token is missing'),
  firstName: yup.string().optional(), 
  lastName: yup.string().optional(),
  contactNumber: yup.string().required('Contact Number is required'),
  birthDate: yup.string().required('Birth Date is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

// 4. Reset Password Form
export const resetPasswordSchema = yup.object({
  token: yup.string().required('Token is missing'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

// 5. Forgot Password Form
export const forgotPasswordSchema = yup.object({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

// 6. System Onboarding Form (Superadmin)
export const onboardingSchema = yup.object({
  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  contactNumber: yup.string().required('Contact Number is required'),
  birthDate: yup.string().required('Birth Date is required'),
  password: yup.string()
    .min(8, 'Password must be 8+ chars')
    .matches(/[A-Z]/, 'Must contain an Uppercase letter')
    .matches(/[0-9]/, 'Must contain a number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});