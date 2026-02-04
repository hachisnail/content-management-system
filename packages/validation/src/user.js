// packages/validation/src/user.js
import * as yup from 'yup';

// Admin updating another user
export const updateUserSchema = yup.object().shape({
  firstName: yup.string().min(1, "First name is required").optional(),
  lastName: yup.string().min(1, "Last name is required").optional(),
  roles: yup.array().of(yup.string()).optional(),
  status: yup.mixed().oneOf(['active', 'disabled', 'banned', 'pending']).optional(),
  password: yup.string().min(6).optional(),
  email: yup.string().email().optional(),
  contactNumber: yup.string().nullable().optional(),
  birthDate: yup.mixed().nullable().optional(), 
  isActive: yup.boolean().optional(),
  avatarId: yup.string().optional()
});

// User updating themselves (Settings Page -> ProfileForm)
export const updateProfileSchema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  contactNumber: yup.string().nullable(),
  birthDate: yup.string().nullable(),
  email: yup.string().email("Invalid email address").nullable(),
});

// User changing password (Settings Page -> SecurityForm)
// [NEW] Added this schema
export const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .notOneOf([yup.ref('currentPassword')], "New password cannot be the same as the old password")
    .required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});