const { getTransporter, isConfigured } = require('../config/mailer');
const { appendEmailAuditLog } = require('./sheetRepo');

// Never throws - a failed/unconfigured send is logged to the audit sheet and
// swallowed, so it can never block or fail the caller's actual task save.
async function sendMail({ to, subject, text, html, recipientName, action }) {
  const auditBase = {
    timestamp: new Date().toISOString(),
    user: recipientName || '',
    action,
    email: to || '',
    details: subject,
  };

  if (!to) {
    await appendEmailAuditLog({ ...auditBase, status: 'Skipped - no email on file' }).catch(() => {});
    return;
  }

  if (!isConfigured()) {
    console.warn(`SMTP not configured - skipping email "${subject}" to ${to}`);
    await appendEmailAuditLog({ ...auditBase, status: 'Skipped - SMTP not configured' }).catch(() => {});
    return;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"API Task Portal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    await appendEmailAuditLog({ ...auditBase, status: 'Sent' }).catch(() => {});
  } catch (err) {
    console.error(`Email send failed ("${subject}" to ${to}):`, err.message);
    await appendEmailAuditLog({ ...auditBase, status: `Failed: ${err.message}`.slice(0, 200) }).catch(() => {});
  }
}

module.exports = { sendMail };
