const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback',
                proxy: true
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                    if (!email) {
                        return done(new Error('No email found in Google profile'), null);
                    }

                    const profilePhoto = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
                    const displayName = profile.displayName || 'Google User';

                    const newUser = {
                        googleId: profile.id,
                        username: `${displayName.replace(/\s+/g, '').toLowerCase()}${profile.id.slice(-4)}`,
                        email: email,
                        profilePhoto: profilePhoto,
                        isVerified: true
                    };

                    // 1. Try finding by Google ID
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // 2. Try finding by Email (Account Linking)
                    user = await User.findOne({ email: email });

                    if (user) {
                        // Link Google ID to existing account
                        user.googleId = profile.id;
                        if (!user.profilePhoto) user.profilePhoto = profilePhoto;
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
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            console.error('Passport Deserialize Error:', err);
            done(err, null);
        }
    });
};
