import { db } from '../models/index.js';

/**
 * Standardized Logging Function.
 * NOTE: We do NOT emit sockets here. The DB Hook handles that.
 */
export const logOperation = async ({
  description,
  operation,
  affectedResource,
  beforeState = null,
  afterState = null,
  initiator, // Should be email (String)
}) => {
  try {
    // Ensure complex objects are converted to JSON before saving
    const safeAfterState = afterState?.toJSON ? afterState.toJSON() : afterState;
    const safeBeforeState = beforeState?.toJSON ? beforeState.toJSON() : beforeState;

    return await db.AuditLog.create({
      description,
      operation: operation.toUpperCase(), // Enforce uppercase (CREATE, LOGIN)
      affectedResource,
      beforeState: safeBeforeState,
      afterState: safeAfterState,
      initiator, 
    });
  } catch (error) {
    console.error('[Logger] Failed to save log:', error);
  }
};


// import { db } from '../models/index.js';

// export const logOperation = async ({
//   description,
//   operation,
//   affectedResource,
//   beforeState,
//   afterState,
//   initiator,
// }) => {
//   try {
//     await db.AuditLog.create({
//       description,
//       operation,
//       affectedResource,
//       beforeState,
//       afterState,
//       initiator,
//     });
//   } catch (error) {
//     console.error('Error logging operation:', error);
//   }
// };
