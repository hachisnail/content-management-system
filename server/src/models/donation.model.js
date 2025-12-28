import { DataTypes } from 'sequelize';

const defineDonationModel = (sequelize) => {
  const Donation = sequelize.define('Donation', {
    // --- Guest Info (Since they have no account) ---
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
    
    // --- Donation Details ---
    itemDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    
    // --- Intake Workflow Status ---
    status: {
      type: DataTypes.ENUM('pending', 'review', 'accepted', 'rejected', 'archived'),
      defaultValue: 'pending',
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true, // Internal notes for staff
    }
  });

  return Donation;
};

export { defineDonationModel as Donation };