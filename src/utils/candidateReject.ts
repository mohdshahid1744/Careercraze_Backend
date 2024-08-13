import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendCandidateRejectionEmail = async (email: string, recruiterName: string, jobTitle: string, companyName: string): Promise<void> => {
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
             <p>We regret to inform you that your application for the ${jobTitle} position at ${companyName} has been rejected by ${recruiterName}.</p>
             <p>We appreciate your interest and the time you invested in applying. Please feel free to apply for other positions in the future.</p>
             <p>Best regards,</p>
             <p>Careercraze Team</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Rejection email sent successfully');
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }
};
