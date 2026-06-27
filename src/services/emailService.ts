import { api } from '../lib/api';

export const emailService = {
  sendLeaveStatusEmail: async (
    employeeEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    status: 'Approved' | 'Rejected',
    reason?: string
  ) => {
    const reasonHtml = reason ? `
    <tr>
      <td style="padding: 5px 0; color: #666; vertical-align: top;"><strong>Notes/Reason:</strong></td>
      <td style="padding: 5px 0;">${reason}</td>
    </tr>` : '';

    await api.post('/email/send-leave-status', {
      to: [employeeEmail],
      subject: `Orbit HR: Your Leave Request has been ${status}`,
      text: `Hello ${employeeName},\n\nWe would like to inform you that your leave request has been reviewed.\n\nDetails:\n- Leave Type: ${leaveType}\n- Period: ${startDate} to ${endDate}\n- Status: ${status}\n${reason ? `- Note from HR: ${reason}\n` : ''}\nIf you have any questions, please contact your HR representative.\n\nBest regards,\nOrbit HR Management Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fcfcfc;">
          <h2 style="color: ${status === 'Approved' ? '#2e7d32' : '#c62828'}; border-bottom: 2px solid ${status === 'Approved' ? '#2e7d32' : '#c62828'}; padding-bottom: 10px;">Leave Request ${status}</h2>
          <p>Hello <strong>${employeeName}</strong>,</p>
          <p>We would like to inform you that your leave request has been reviewed.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #666; width: 30%;"><strong>Leave Type:</strong></td>
                <td style="padding: 5px 0;">${leaveType}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;"><strong>Period:</strong></td>
                <td style="padding: 5px 0;">${startDate} to ${endDate}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;"><strong>Status:</strong></td>
                <td style="padding: 5px 0; color: ${status === 'Approved' ? '#2e7d32' : '#c62828'}; font-weight: bold;">${status}</td>
              </tr>
              ${reasonHtml}
            </table>
          </div>
          <p style="font-size: 0.9em; color: #666; margin-top: 20px;">If you have any questions regarding this update, please contact your HR department or manager.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated notification from Orbit Employee Management System.</p>
        </div>
      `
    });
  }
};
