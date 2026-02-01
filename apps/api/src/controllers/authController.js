import passport from "passport";
import { ROLES, ROLE_HIERARCHY } from "../config/roles.js";
import { authService } from "../services/authService.js";
import { userService } from "../services/userService.js";
import { trackActivity } from "../utils/audit.js";
import { appEvents, EVENTS } from "../utils/events.js";
import { User } from "../models/index.js";

export const inviteUser = async (req, res) => {
  try {
    const { email, roles, firstName, lastName } = req.body;
    const requester = req.user;

    const requesterRank = Math.max(
      ...requester.roles.map((r) => ROLE_HIERARCHY[r] || 0),
    );
    const assignedRank = Math.max(...roles.map((r) => ROLE_HIERARCHY[r] || 0));

    if (requesterRank < 100 && assignedRank >= 50) {
      return res
        .status(403)
        .json({
          error: "Access Denied: You cannot invite Admins or Superadmins.",
        });
    }

    if (
      assignedRank >= requesterRank &&
      !requester.roles.includes(ROLES.SUPERADMIN)
    ) {
      return res
        .status(403)
        .json({
          error:
            "Access Denied: You cannot assign a role equal to or higher than your own.",
        });
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
    const status = error.message === "User already exists" ? 409 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const completeRegistration = async (req, res) => {
  try {
    const { token, password, confirmPassword, birthDate, contactNumber } =
      req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const user = await authService.completeRegistration(token, {
      password,
      birthDate,
      contactNumber,
    });

    req.login(user, (err) => {
      if (err) throw err;
      return res.json({
        message: "Registration complete",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
      });
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    await authService.resendInvitation(id);
    trackActivity(req, "RESEND_INVITE", "users", { userId: id });
    res.json({ message: "Invitation resent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = (req, res, next) => {
  passport.authenticate("local", async (err, partialUser, info) => {
    if (err) return next(err);
    if (!partialUser) return res.status(401).json(info);

    // Session Concurrency Check
    if (
      partialUser.currentSessionId &&
      partialUser.currentSessionId !== req.sessionID
    ) {
      appEvents.emit(EVENTS.SESSION_TERMINATED, {
        sessionId: partialUser.currentSessionId,
        reason: "You have been logged out because a new login was detected from another device.",
      });
      // Non-blocking destroy
      req.sessionStore.destroy(partialUser.currentSessionId, () => {});
    }

    req.logIn(partialUser, async (err) => {
      if (err) return next(err);

      try {
        const [fullUser] = await Promise.all([
          // 1. Fetch Full User
          userService.findById(partialUser.id),
          
          // 2. Update DB Stats
          // [FIX] Added individualHooks: true so the socket hook fires!
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

      // 2. [FIX] Audit Log the logout BEFORE destroying the session
      // (req.user is required for trackActivity to know who it is)
      await trackActivity(req, "LOGOUT", "auth");

      req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
          if (err) return next(err);
          res.clearCookie('connect.sid');
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
export const getMe = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const user = await userService.findById(req.user.id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });
    await authService.resetPassword(token, password);
    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const onboard = async (req, res, next) => {
  try {
    const user = await authService.onboardSuperadmin(req.body);
    req.login(user, (err) => {
      if (err) return next(err);
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
