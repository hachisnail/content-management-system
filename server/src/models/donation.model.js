import { DataTypes } from 'sequelize';
import { ulid } from 'ulid'; 

const defineDonationModel = (sequelize) => {
  const Donation = sequelize.define('Donation', {
    id: {
      type: DataTypes.STRING(26),
      defaultValue: () => ulid(),
      primaryKey: true,
    },
    
    donorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    donorEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true }
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    itemDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    
    status: {
      type: DataTypes.ENUM('pending', 'review', 'accepted', 'rejected', 'archived'),
      defaultValue: 'pending',
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true, 
    }
  });

  return Donation;
};

export { defineDonationModel as Donation };