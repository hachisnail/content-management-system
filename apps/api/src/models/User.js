/* api/src/models/User.js */
import { DataTypes } from 'sequelize';
import { ulid } from 'ulid';
import sequelize from '../config/db.js';
import { ROLES } from '../config/roles.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.CHAR(26),
    defaultValue: () => ulid(),
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true, notEmpty: true },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
    set(value) {
      throw new Error('Do not try to set the `fullName` value!');
    }
  },
  contactNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  roles: {
    type: DataTypes.JSON, 
    allowNull: false,
    defaultValue: [ROLES.GUEST],
    get() {
      const rawValue = this.getDataValue('roles');
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return Array.isArray(rawValue) ? rawValue : [];
    },
    set(value) {
      const rolesToStore = Array.isArray(value) ? value : [value];
      this.setDataValue('roles', rolesToStore);
    },
    validate: {
      isValidRole(value) {
        if (!Array.isArray(value)) throw new Error('Roles must be an array');
        const validRoles = Object.values(ROLES);
        value.forEach(r => {
          if (!validRoles.includes(r)) throw new Error(`Invalid role: ${r}`);
        });
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  invitationToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  invitationExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
   type: DataTypes.ENUM('pending', 'active', 'disabled'),
    defaultValue: 'active',
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  currentSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  activityStatus: {
    type: DataTypes.VIRTUAL,
    get() {
      if (!this.isOnline) return 'offline';
      
      const now = new Date();
      if (!this.lastActiveAt) return 'offline';
      const diffMinutes = (now - new Date(this.lastActiveAt)) / 1000 / 60;
      
      if (diffMinutes < 5) return 'online';
      if (diffMinutes < 30) return 'idle';
      return 'offline';
    }
  }
}, {
  tableName: 'users',
  underscored: true,
  paranoid: true,
  indexes: [
    { 
      unique: true, 
      fields: ['email'], 
      name: 'users_email_unique' 
    },
    { 
      fields: ['last_name', 'first_name'], 
      name: 'users_full_name_idx' 
    } 
  ]
});

// --- associations ---
User.associate = (models) => {
  User.hasMany(models.File, { 
    foreignKey: 'uploadedBy', 
    as: 'uploadedFiles' 
  });

  User.belongsToMany(models.File, {
    through: {
      model: models.FileLink,
      unique: false,
      scope: {
        recordType: 'users', 
      }
    },
    foreignKey: 'recordId',
    otherKey: 'fileId',
    as: 'avatarFiles',
    constraints: false
  });

  User.hasMany(models.FileLink, {
    foreignKey: 'recordId',
    constraints: false,
    scope: {
      recordType: 'users'
    },
    as: 'fileLinks'
  });
};

// [FIX] Failsafe method to scrub sensitive data before sending to client
User.prototype.toJSON = function () {
  const values = { ...this.get() };

  // Flatten avatar structure for frontend convenience
  if (values.avatarFiles && values.avatarFiles.length > 0) {
    values.avatar = values.avatarFiles[0];
  } else {
    values.avatar = null;
  }

  // Cleanup Join Tables
  delete values.avatarFiles;
  delete values.fileLinks;

  // Cleanup Security Sensitive Fields
  delete values.password;
  delete values.invitationToken;
  delete values.invitationExpiresAt;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpires;
  delete values.currentSessionId; // [CRITICAL SECURITY FIX]
  delete values.deletedAt;

  return values;
};

export default User;