import passport from 'passport';

export const login = (req, res, next) => {
  // Use the 'local' strategy defined in config/passport.js
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info.message });

    // Manually establish the session
    req.logIn(user, (err) => {
      if (err) return next(err);
      
      // Session is saved in MariaDB automatically here
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: { id: user.id, email: user.email, role: user.role }
      });
    });
  })(req, res, next);
};

export const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    // Destroy the session in MariaDB
    req.session.destroy(() => {
        res.clearCookie('user_sid'); // Clear cookie on client
        res.status(200).json({ success: true, message: 'Logged out' });
    });
  });
};

export const checkAuth = (req, res) => {
  if (req.isAuthenticated()) {
    const safeUser = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      // add other public fields here if needed
    };

    res.json({ isAuthenticated: true, user: safeUser });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
};