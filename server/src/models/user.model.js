import { DataTypes } from 'sequelize';

const defineUserModel = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
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
      // Switch from ENUM to JSON to support multiple roles ['admin', 'viewer']
      type: DataTypes.JSON, 
      allowNull: false,
      defaultValue: ["viewer"], // Default is now an array
      // Getter/Setter ensures it always behaves like an array in your code
      get() {
        const rawValue = this.getDataValue('role');
        // Handle cases where DB might still have old string values
        if (typeof rawValue === 'string') {
            // Check if it's a JSON string or just a plain role string
            try { return JSON.parse(rawValue); } catch { return [rawValue]; }
        }
        return rawValue || [];
      },
      set(value) {
        // Ensure we always store an array
        const valToStore = Array.isArray(value) ? value : [value];
        this.setDataValue('role', valToStore);
      }
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
  }, {
    timestamps: true,
    tableName: 'users',
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  return User;
};

export { defineUserModel as User };