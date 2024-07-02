import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();


export const sendRejectionEmail = async (email: string, reason: string): Promise<void> => {
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
            subject: 'Application Rejected',
            html: `<p>Dear Applicant,</p>
                   <p>We regret to inform you that your application has been rejected by the admin.</p>
                   <p>Reason: ${reason}</p>
                   <p>Please contact us for further details.</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Rejection email sent successfully');
    } catch (error) {
        console.error('Error sending rejection email:', error);
    }
};
