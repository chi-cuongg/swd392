const nodemailer = require('nodemailer');

// Export a wrapped send function
exports.sendResetEmail = async (to, resetToken) => {
    const isMock = !process.env.SMTP_HOST;
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    if (isMock) {
        // Fallback for development if SMTP is not configured
        console.log('\n---------------------------------------------------------');
        console.log(' mock email interceptor: No SMTP configured');
        console.log('---------------------------------------------------------');
        console.log(` TO: ${to}`);
        console.log(` SUBJECT: Password Reset Request`);
        console.log(` \n Click the link below to reset your password:\n`);
        console.log(` \x1b[36m${resetUrl}\x1b[0m\n`);
        console.log('---------------------------------------------------------\n');
        return { success: true, mock: true };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Smart Monitoring Platform" <noreply@spla.com>',
            to,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: sans-serif; max-w-lg margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>You recently requested to reset your password for your account.</p>
                    <p>Click the button below to reset it. This link is valid for 1 hour.</p>
                    <a href="${resetUrl}" style="display:inline-block; padding: 10px 20px; color: white; background-color: #3b82f6; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    <p style="margin-top: 20px; font-size: 13px; color: #666;">If you did not request a password reset, please ignore this email.</p>
                </div>
            `,
        });
        
        return { success: true };
    } catch (error) {
        console.error('Email sending failed:', error);
        throw { status: 500, message: 'Failed to send reset email' };
    }
};
