import * as yup from 'yup';

// 1. Login Form
export const loginSchema = yup.object({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string()
    .required('Password is required'),
});

// 2. Admin Invite Form (Admin invites a new user)
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
    .of(yup.string().oneOf(['admin', 'curator', 'editor', 'donor', 'auditor']))
    .min(1, 'At least one role is required')
    .required('Roles are required'),
});

// 3. Complete Registration Form (User sets password)
export const completeRegistrationSchema = yup.object({
  token: yup.string()
    .required('Invitation token is missing'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});