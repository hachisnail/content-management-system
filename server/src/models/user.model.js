import { DataTypes } from 'sequelize';

const defineUserModel = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID, // CHANGED: Integer -> UUID
        defaultValue: DataTypes.UUIDV4, // CHANGED: Auto-generate UUIDs
        primaryKey: true,
      },
      // ... other fields remain the same ...
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      middleName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
        collate: 'utf8mb4_general_ci',
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      birthDay: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      role: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: ['viewer'],
        get() {
          const rawValue = this.getDataValue('role');
          if (typeof rawValue === 'string') {
            try {
              return JSON.parse(rawValue);
            } catch {
              return [rawValue];
            }
          }
          return rawValue || [];
        },
        set(value) {
          const valToStore = Array.isArray(value) ? value : [value];
          this.setDataValue('role', valToStore);
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'active', 'disabled'),
        defaultValue: 'pending',
      },
      registrationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      socketId: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
          const value = this.getDataValue('socketId');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('socketId', JSON.stringify(value));
        },
      },
      last_active: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      invitationExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: 'users',
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
      ],
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    },
  );

  return User;
};

export { defineUserModel as User };
