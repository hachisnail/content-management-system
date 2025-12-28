import Sequelize from 'sequelize';
import { dbConfig } from '../config/database.js'; 
import { User as UserModel } from './user.model.js';
import { Donation as DonationModel } from './donation.model.js';

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = UserModel(sequelize);
db.Donation = DonationModel(sequelize);

export { db };