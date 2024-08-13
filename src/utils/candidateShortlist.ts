import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
export const sendCandidateShortlistedEmail = async (email: string, recruiterName: string, jobTitle: string, companyName: string): Promise<void> => {
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
        subject: 'Application Shortlisted',
        html: `<p>Dear Applicant,</p>
               <p>Congratulations! Your application for the ${jobTitle} position at ${companyName} has been shortlisted by ${recruiterName}.</p>
               <p>We will contact you soon with further details about the next steps in the selection process.</p>
               <p>Best regards,</p>
               <p>Careercraze Team</p>`,
      };
  
      await transporter.sendMail(mailOptions);
      console.log('Shortlisting email sent successfully');
    } catch (error) {
      console.error('Error sending shortlisting email:', error);
    }
  };