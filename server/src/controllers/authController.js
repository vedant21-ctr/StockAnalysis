const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google Login/Signup
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Google ID Token is required' });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // Check if user exists, if not create
        let user = await User.findOne({ googleId: sub });

        if (!user) {
            // Check if user exists with same email (but different sub - shouldn't happen usually with Google)
            user = await User.findOne({ email });

            if (user) {
                user.googleId = sub;
                user.picture = picture;
                await user.save();
            } else {
                user = await User.create({
                    name,
                    email,
                    googleId: sub,
                    picture,
                    role: 'admin' // Default to admin for simplicity now
                });
            }
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ success: false, message: 'Invalid Google Token' });
    }
};

// Helper function to create token and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            picture: user.picture
        },
    });
};
