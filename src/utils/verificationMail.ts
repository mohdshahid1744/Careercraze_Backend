import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export const sendVerificationEmail = async (email: string): Promise<void> => {
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

        const imagePath = path.resolve(__dirname, './Image/Logo.png');

        try {
            const attachment = fs.readFileSync(imagePath, { encoding: 'base64' });

            const mailOptions = {
                from: `Careercraze <${userEmail}>`,
                to: email,
                subject: 'Application Verified',
                html: `<img src="cid:image1" alt="Image" style="width: 100%; height: auto; max-width: 300px; display: block; margin: 0 auto;">
                       <p>Dear Applicant,</p>
                       <p>Your Email has verified successfully.</p>`,
                attachments: [
                    {
                        filename: 'Logo.png',
                        content: attachment,
                        encoding: 'base64',
                        cid: 'image1'
                    }
                ]
            };

            await transporter.sendMail(mailOptions);
            console.log('Verification email sent successfully');
        } catch (error) {
            console.error(`Error reading image file at ${imagePath}:`, error);
        }
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};
