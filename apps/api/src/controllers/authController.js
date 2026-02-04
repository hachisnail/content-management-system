import passport from "passport";
import { ROLES, ROLE_HIERARCHY } from "../config/roles.js";
import { authService } from "../services/authService.js";
import { userService } from "../services/userService.js";
import { trackActivity } from "../utils/audit.js";
import { appEvents, EVENTS } from "../core/events/EventBus.js";
import { User } from "../models/index.js";
import { notificationService } from "../services/notificationService.js";

const throwError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

export const inviteUser = async (req, res, next) => {
  try {
    const { email, roles, firstName, lastName } = req.body;
    const requester = req.user;

    const requesterRank = Math.max(
      ...requester.roles.map((r) => ROLE_HIERARCHY[r] || 0),
    );
    const assignedRank = Math.max(...roles.map((r) => ROLE_HIERARCHY[r] || 0));

    if (requesterRank < 100 && assignedRank >= 50) {
      throwError("Access Denied: You cannot invite Admins or Superadmins.", 403);
    }

    if (
      assignedRank >= requesterRank &&
      !requester.roles.includes(ROLES.SUPERADMIN)
    ) {
      throwError("Access Denied: You cannot assign a role equal to or higher than your own.", 403);
    }

    const newUser = await authService.inviteUser({
      email,
      roles,
      firstName,
      lastName,
    });
    trackActivity(req, "INVITE_USER", "users", { invitedEmail: email });
    res.status(201).json({ message: "Invitation sent", userId: newUser.id });
  } catch (error) {
    if (error.message === "User already exists") error.status = 409;
    next(error);
  }
};

export const completeRegistration = async (req, res, next) => {
  try {
    const { token, password, confirmPassword, birthDate, contactNumber } =
      req.body;

    if (password !== confirmPassword) {
      throwError("Passwords do not match", 400);
    }

    const user = await authService.completeRegistration(token, {
      password,
      birthDate,
      contactNumber,
    });

    req.login(user, async (err) => {
      if (err) return next(err);

      try {
        await User.update(
          {
            lastLoginAt: new Date(),
            currentSessionId: req.sessionID,
            isOnline: true,
            lastActiveAt: new Date(),
          },
          { 
            where: { id: user.id },
          }
        );

        trackActivity(req, "REGISTER_COMPLETE", "auth");
        await notificationService.broadcastToTargets(
          { roles: [ROLES.SUPERADMIN] }, 
          {
            title: "New User Registered",
            message: `${user.firstName} ${user.lastName} has joined the system.`,
            type: "success",
            data: { link: `/users/${user.id}` }
          }
        );

        return res.json({
          message: "Registration complete",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            activityStatus: "online"
          },
        });
      } catch (dbError) {
        return next(dbError);
      }
    });
  } catch (error) {
    next(error);
  }
};

export const resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await authService.resendInvitation(id);
    trackActivity(req, "RESEND_INVITE", "users", { userId: id });
    res.json({ message: "Invitation resent successfully" });
  } catch (error) {
    next(error);
  }
};

export const login = (req, res, next) => {
  passport.authenticate("local", async (err, partialUser, info) => {
    if (err) return next(err);
    if (!partialUser) {
        // Pass 401 to global handler instead of direct json
        const error = new Error(info ? info.message : "Invalid credentials");
        error.status = 401;
        return next(error);
    }

    if (
      partialUser.currentSessionId &&
      partialUser.currentSessionId !== req.sessionID
    ) {
      appEvents.emit(EVENTS.SESSION_TERMINATED, {
        sessionId: partialUser.currentSessionId,
        reason: "You have been logged out because a new login was detected from another device.",
      });
      // Best effort destroy, don't wait/block
      if (req.sessionStore && req.sessionStore.destroy) {
          req.sessionStore.destroy(partialUser.currentSessionId, () => {});
      }
    }

    req.logIn(partialUser, async (err) => {
      if (err) return next(err);

      try {
        const [fullUser] = await Promise.all([
          userService.findById(partialUser.id),
          User.update(
            {
              lastLoginAt: new Date(),
              currentSessionId: req.sessionID,
              isOnline: true,
              lastActiveAt: new Date(),
            },
            { 
              where: { id: partialUser.id },
            },
          )
        ]);

        trackActivity(req, "LOGIN", "auth");

        const safeUser = fullUser; 
        safeUser.activityStatus = "online";

        return res.json({ message: "Logged in", user: safeUser });
      } catch (dbError) {
        return next(dbError);
      }
    });
  })(req, res, next);
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.update(
        { 
          isOnline: false, 
          lastActiveAt: new Date(),
          currentSessionId: null 
        },
        { 
          where: { id: req.user.id } 
        }
      );

      await trackActivity(req, "LOGOUT", "auth");

      req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
          if (err) return next(err);
          res.clearCookie('sid'); // Match the cookie name in session config
          return res.status(200).json({ message: 'Logged out successfully' });
        });
      });
    } else {
      res.status(200).json({ message: 'User not logged in' });
    }
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  if (!req.user) {
    const error = new Error("Not authenticated");
    error.status = 401;
    return next(error);
  }

  try {
    const user = await userService.findById(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (password !== confirmPassword)
      throwError("Passwords do not match", 400);

    await authService.resetPassword(token, password);
    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throwError("New passwords do not match", 400);
    }

    await userService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    if (error.message === 'Incorrect current password') {
        error.status = 401;
    }
    next(error);
  }
};

export const onboard = async (req, res, next) => {
  try {
    const user = await authService.onboardSuperadmin(req.body);
    req.login(user, async (err) => {
      if (err) return next(err);

      await User.update(
        {
          lastLoginAt: new Date(),
          currentSessionId: req.sessionID,
          isOnline: true,
          lastActiveAt: new Date(),
        },
        { 
          where: { id: user.id },
        }
      );

      trackActivity(req, "SYSTEM_ONBOARD", "system", { adminId: user.id });
      return res.status(201).json({ message: "System initialized.", user });
    });
  } catch (error) {
    next(error);
  }
};

export const checkOnboardingStatus = async (req, res, next) => {
  try {
    const needed = await authService.isOnboardingNeeded();
    res.json({ onboardingNeeded: needed });
  } catch (error) {
    next(error);
  }
};