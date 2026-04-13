package org.acme.service;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

/**
 * Email Service
 * Handles sending emails for password notifications, welcome emails, etc.
 * Uses Quarkus Mailer extension
 */
@ApplicationScoped
public class EmailService {

    private static final Logger logger = Logger.getLogger(EmailService.class);

    @Inject
    Mailer mailer;

    /**
     * Send welcome email to new gestionnaire with temporary password
     * @param recipientEmail Email address of the new gestionnaire
     * @param recipientName Name of the new gestionnaire
     * @param temporaryPassword The temporary password (plain text)
     */
    public void sendWelcomeEmailWithPassword(
            String recipientEmail,
            String recipientName,
            String temporaryPassword) {

        try {
            String subject = "Welcome to CrediWise - Your Account is Ready!";

            String htmlBody = buildWelcomeEmailTemplate(recipientName, temporaryPassword);

            Mail mail = new Mail()
                    .setFrom("noreply@crediwise.com")
                    .addTo(recipientEmail)
                    .setSubject(subject)
                    .setHtml(htmlBody);

            mailer.send(mail);

            logger.infof("Welcome email sent to: %s", recipientEmail);
        } catch (Exception e) {
            logger.errorf("Failed to send welcome email to %s: %s", recipientEmail, e.getMessage());
            // Don't throw - let the user be created even if email fails
            // The admin can see the password in the response
        }
    }

    /**
     * Send password change notification email
     * @param recipientEmail Email address
     * @param recipientName Name of the user
     * @param changedAt When the password was changed
     */
    public void sendPasswordChangeNotification(
            String recipientEmail,
            String recipientName,
            String changedAt) {

        try {
            String subject = "Password Change Confirmation - CrediWise";

            String htmlBody = buildPasswordChangeEmailTemplate(recipientName, changedAt);

            Mail mail = new Mail()
                    .setFrom("noreply@crediwise.com")
                    .addTo(recipientEmail)
                    .setSubject(subject)
                    .setHtml(htmlBody);

            mailer.send(mail);

            logger.infof("Password change notification sent to: %s", recipientEmail);
        } catch (Exception e) {
            logger.errorf("Failed to send password change email to %s: %s", recipientEmail, e.getMessage());
        }
    }

    /**
     * Send password reset email (for admin reset)
     * @param recipientEmail Email address
     * @param recipientName Name of the user
     * @param temporaryPassword Temporary password to reset
     */
    public void sendPasswordResetEmail(
            String recipientEmail,
            String recipientName,
            String temporaryPassword) {

        try {
            String subject = "Your Password Has Been Reset - CrediWise";

            String htmlBody = buildPasswordResetEmailTemplate(recipientName, temporaryPassword);

            Mail mail = new Mail()
                    .setFrom("noreply@crediwise.com")
                    .addTo(recipientEmail)
                    .setSubject(subject)
                    .setHtml(htmlBody);

            mailer.send(mail);

            logger.infof("Password reset email sent to: %s", recipientEmail);
        } catch (Exception e) {
            logger.errorf("Failed to send password reset email to %s: %s", recipientEmail, e.getMessage());
        }
    }

    /**
     * Build HTML template for welcome email
     */
    private String buildWelcomeEmailTemplate(String name, String password) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }\n" +
                "        .container { background-color: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 20px auto; }\n" +
                "        .header { color: #2c3e50; font-size: 24px; font-weight: bold; margin-bottom: 20px; }\n" +
                "        .content { color: #555; line-height: 1.6; margin-bottom: 20px; }\n" +
                "        .credentials-box { background-color: #f9f9f9; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; }\n" +
                "        .label { font-weight: bold; color: #2c3e50; }\n" +
                "        .value { color: #e74c3c; font-family: 'Courier New', monospace; font-size: 14px; padding: 5px; background-color: #fff; }\n" +
                "        .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; margin: 15px 0; color: #856404; }\n" +
                "        .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">Welcome to CrediWise! 🎉</div>\n" +
                "        \n" +
                "        <div class=\"content\">\n" +
                "            <p>Hello <strong>" + name + "</strong>,</p>\n" +
                "            <p>Your account has been successfully created on CrediWise banking system.</p>\n" +
                "            <p>To get started, use the credentials below to log in:</p>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"credentials-box\">\n" +
                "            <p><span class=\"label\">Email:</span><br/><span class=\"value\">" + name + "</span></p>\n" +
                "            <p><span class=\"label\">Temporary Password:</span><br/><span class=\"value\">" + password + "</span></p>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"warning\">\n" +
                "            ⚠️ <strong>Important:</strong>\n" +
                "            <ul>\n" +
                "                <li>This is a temporary password - you must change it on first login</li>\n" +
                "                <li>Keep this password confidential</li>\n" +
                "                <li>Do not share this email with anyone</li>\n" +
                "                <li>If you did not request this account, please contact your administrator immediately</li>\n" +
                "            </ul>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"content\">\n" +
                "            <p><strong>Next Steps:</strong></p>\n" +
                "            <ol>\n" +
                "                <li>Log in with the credentials above</li>\n" +
                "                <li>You will be prompted to change your password</li>\n" +
                "                <li>Create a strong, unique password (at least 8 characters with uppercase, lowercase, numbers, and special characters)</li>\n" +
                "            </ol>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"footer\">\n" +
                "            <p>If you have any questions or issues, please contact your administrator.</p>\n" +
                "            <p>This is an automated email - please do not reply to this message.</p>\n" +
                "            <p>&copy; 2024 CrediWise Banking System. All rights reserved.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build HTML template for password change notification
     */
    private String buildPasswordChangeEmailTemplate(String name, String changedAt) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }\n" +
                "        .container { background-color: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 20px auto; }\n" +
                "        .header { color: #27ae60; font-size: 24px; font-weight: bold; margin-bottom: 20px; }\n" +
                "        .content { color: #555; line-height: 1.6; }\n" +
                "        .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">✓ Password Changed Successfully</div>\n" +
                "        \n" +
                "        <div class=\"content\">\n" +
                "            <p>Hello <strong>" + name + "</strong>,</p>\n" +
                "            <p>This is to confirm that your password was successfully changed on <strong>" + changedAt + "</strong>.</p>\n" +
                "            <p>If you did not make this change, please contact your administrator immediately.</p>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"footer\">\n" +
                "            <p>&copy; 2024 CrediWise Banking System. All rights reserved.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build HTML template for password reset
     */
    private String buildPasswordResetEmailTemplate(String name, String password) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }\n" +
                "        .container { background-color: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 20px auto; }\n" +
                "        .header { color: #e74c3c; font-size: 24px; font-weight: bold; margin-bottom: 20px; }\n" +
                "        .content { color: #555; line-height: 1.6; margin-bottom: 20px; }\n" +
                "        .credentials-box { background-color: #f9f9f9; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }\n" +
                "        .value { color: #e74c3c; font-family: 'Courier New', monospace; font-size: 14px; }\n" +
                "        .warning { background-color: #ffe5e5; border: 1px solid #e74c3c; padding: 12px; border-radius: 4px; margin: 15px 0; }\n" +
                "        .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">Your Password Has Been Reset</div>\n" +
                "        \n" +
                "        <div class=\"content\">\n" +
                "            <p>Hello <strong>" + name + "</strong>,</p>\n" +
                "            <p>Your password has been reset by an administrator. Below is your new temporary password:</p>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"credentials-box\">\n" +
                "            <p><strong>Temporary Password:</strong><br/><span class=\"value\">" + password + "</span></p>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"warning\">\n" +
                "            ⚠️ You must change this password immediately on your next login.\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"footer\">\n" +
                "            <p>If you did not request this password reset, please contact your administrator.</p>\n" +
                "            <p>&copy; 2024 CrediWise Banking System. All rights reserved.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
