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
      type: DataTypes.ENUM(
        'super_admin',
        'admin',
        'inventory_manager',
        'acquisitions_manager',
        'articles_manager',
        'appointments_manager',
        'viewer'
      ),
      defaultValue: 'viewer',
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