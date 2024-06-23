import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const emailVerification = async (email: string, otp: string): Promise<void> => {
    try {
        const userEmail = process.env.EMAIL;
        const userPassword = process.env.PASSWORD;

        if (!userEmail || !userPassword) {
            throw new Error('Email or password environment variables are not set');
        }
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: userEmail,
                pass: userPassword
            },
        });
        const mailOptions = {
            from: `Careercraze <${userEmail}>`,
            to: email,
            subject: 'E-Mail Verification',
            html: `<p>Please enter the code: <strong>${otp}</strong> to verify your email.</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
