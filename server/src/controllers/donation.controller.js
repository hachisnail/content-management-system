import { db } from '../models/index.js';
import { getIO } from '../socket-store.js'; // Import Socket for realtime alerts

// PUBLIC: Guest submits a form
export const submitDonation = async (req, res, next) => {
  try {
    const { donorName, donorEmail, itemDescription, quantity } = req.body;

    const donation = await db.Donation.create({
      donorName,
      donorEmail,
      itemDescription,
      quantity
    });

    // REALTIME: Alert all logged-in staff immediately!
    const io = getIO();

    res.status(201).json({ success: true, message: 'Donation submitted for review!' });
  } catch (error) {
    next(error);
  }
};

// PROTECTED: Staff updates status (The Intake Process)
export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const donation = await db.Donation.findByPk(id);
    if (!donation) throw new Error('Donation not found');

    donation.status = status;
    if (adminNotes) donation.adminNotes = adminNotes;
    await donation.save();

    res.json({ success: true, data: donation });
  } catch (error) {
    next(error);
  }
};

// PROTECTED: List all donations
export const getAllDonations = async (req, res, next) => {
  try {
    // Sort by newest first
    const donations = await db.Donation.findAll({ order: [['createdAt', 'DESC']] });
    res.json(donations);
  } catch (error) {
    next(error);
  }
};