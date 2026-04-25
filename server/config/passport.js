const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                const newUser = {
                    googleId: profile.id,
                    // Use a unique username by appending part of the Google ID
                    username: `${profile.displayName.replace(/\s+/g, '').toLowerCase()}${profile.id.slice(-4)}`,
                    email: profile.emails[0].value,
                    profilePhoto: profile.photos[0].value,
                    isVerified: true 
                };

                try {
                    // 1. Try finding by Google ID
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // 2. Try finding by Email (Account Linking)
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // Link Google ID to existing account
                        user.googleId = profile.id;
                        if (!user.profilePhoto) user.profilePhoto = profile.photos[0].value;
                        user.isVerified = true;
                        await user.save();
                        return done(null, user);
                    }

                    // 3. Create new user if neither exists
                    user = await User.create(newUser);
                    done(null, user);
                } catch (err) {
                    console.error('Passport Google Strategy Error:', err);
                    done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        const user = await User.findById(id);
        done(null, user);
    });
};
