/* api/src/models/scopes.js */
import { File, User } from './index.js';

// Define sensitive fields to exclude globally
export const SENSITIVE_FIELDS = [
  'password', 
  'invitationToken', 
  'invitationExpiresAt',
  'resetPasswordToken',
  'resetPasswordExpires',
  'currentSessionId', // [FIX] Prevents session hijacking risks
  'deletedAt'
];

export const UserScopes = {
  // Standard include for User + Avatar
  withAvatar: () => ({
    attributes: { 
      exclude: SENSITIVE_FIELDS 
    },
    include: [{
      model: File,
      as: 'avatarFiles',
      attributes: ['id', 'path', 'mimetype', 'originalName', 'visibility', 'size'],
      through: { attributes: [] },
      required: false
    }]
  }),

  // For use when User is a child (e.g., File.uploader)
  includeUploader: () => ({
    model: User,
    as: 'uploader',
    attributes: ['id', 'firstName', 'lastName', 'email', 'roles', 'isOnline'], // Explicitly whitelist safe fields
    include: [{
      model: File,
      as: 'avatarFiles',
      attributes: ['id', 'path', 'mimetype', 'originalName', 'visibility', 'size'],
      required: false,
      through: { attributes: [] }
    }]
  })
};