import { EmailOptions } from './email';

// Common template wrapper
function wrapTemplate(title: string, content: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .content h2 { color: #1e293b; margin-top: 0; }
            .info-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .info-label { color: #64748b; }
            .info-value { color: #1e293b; font-weight: 600; }
            .button { display: inline-block; background: #3b82f6; color: white !important; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
            .footer a { color: #3b82f6; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Fixelo</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} Fixelo. All rights reserved.</p>
                <p><a href="https://fixelo.app">fixelo.app</a> | <a href="mailto:support@fixelo.app">Support</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// ===== CUSTOMER EMAILS =====

export function bookingConfirmationEmail(data: {
    customerName: string;
    bookingId: string;
    serviceName: string;
    scheduledDate: Date;
    scheduledTime: string;
    address: string;
    totalPrice: number;
}): EmailOptions {
    const content = `
        <h2>Booking Confirmed! 🎉</h2>
        <p>Hi ${data.customerName},</p>
        <p>Thank you for booking with Fixelo. Your cleaning is confirmed.</p>
        
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Service</span>
                <span class="info-value">${data.serviceName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">${data.scheduledDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Time</span>
                <span class="info-value">${data.scheduledTime}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Address</span>
                <span class="info-value">${data.address}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total</span>
                <span class="info-value">$${data.totalPrice.toFixed(2)}</span>
            </div>
        </div>
        
        <p>We're matching you with a top-rated cleaner now. You'll receive another email once a cleaner has been assigned.</p>
        
        <a href="https://fixelo.app/dashboard" class="button">View Booking</a>
    `;

    return {
        to: '', // Will be filled by caller
        subject: `Booking Confirmed - ${data.serviceName} on ${data.scheduledDate.toLocaleDateString()}`,
        html: wrapTemplate('Booking Confirmed', content),
    };
}

export function cleanerAssignedEmail(data: {
    customerName: string;
    cleanerName: string;
    cleanerRating: number;
    scheduledDate: Date;
    scheduledTime: string;
}): EmailOptions {
    const stars = '⭐'.repeat(Math.round(data.cleanerRating));

    const content = `
        <h2>Your Cleaner Has Been Assigned! 👋</h2>
        <p>Hi ${data.customerName},</p>
        <p>Great news! We've matched you with a verified cleaner.</p>
        
        <div class="info-box" style="text-align: center;">
            <h3 style="margin: 0 0 8px;">${data.cleanerName}</h3>
            <p style="margin: 0; font-size: 20px;">${stars} (${data.cleanerRating.toFixed(1)})</p>
        </div>
        
        <p><strong>Arriving:</strong> ${data.scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${data.scheduledTime}</p>
        
        <p>If you need to make any changes, please contact us at least 24 hours before your appointment.</p>
        
        <a href="https://fixelo.app/dashboard" class="button">View Details</a>
    `;

    return {
        to: '',
        subject: `Cleaner Assigned - ${data.cleanerName} will arrive ${data.scheduledDate.toLocaleDateString()}`,
        html: wrapTemplate('Cleaner Assigned', content),
    };
}

// ===== CLEANER EMAILS =====

export function newJobOfferEmail(data: {
    cleanerName: string;
    serviceName: string;
    address: string;
    scheduledDate: Date;
    scheduledTime: string;
    estimatedPayout: number;
    bookingId: string;
}): EmailOptions {
    const content = `
        <h2>New Job Available! 💼</h2>
        <p>Hi ${data.cleanerName},</p>
        <p>You've been matched with a new cleaning job in your area.</p>
        
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Service</span>
                <span class="info-value">${data.serviceName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">${data.scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Time</span>
                <span class="info-value">${data.scheduledTime}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Location</span>
                <span class="info-value">${data.address}</span>
            </div>
            <div class="info-row" style="padding-top: 10px; border-top: 1px solid #e2e8f0; margin-top: 10px;">
                <span class="info-label">Your Payout</span>
                <span class="info-value" style="color: #16a34a; font-size: 18px;">$${data.estimatedPayout.toFixed(2)}</span>
            </div>
        </div>
        
        <p><strong>⚠️ This offer expires in 15 minutes.</strong></p>
        
        <a href="https://fixelo.app/cleaner/jobs/${data.bookingId}" class="button">Accept Job</a>
    `;

    return {
        to: '',
        subject: `New ${data.serviceName} Job - $${data.estimatedPayout.toFixed(0)} on ${data.scheduledDate.toLocaleDateString()}`,
        html: wrapTemplate('New Job Offer', content),
    };
}

export function applicationApprovedEmail(data: {
    cleanerName: string;
}): EmailOptions {
    const content = `
        <h2>Welcome to Fixelo! 🎉</h2>
        <p>Hi ${data.cleanerName},</p>
        <p>Congratulations! Your application has been approved. You're now ready to start earning with Fixelo.</p>
        
        <div class="info-box">
            <h3 style="margin-top: 0;">What's Next?</h3>
            <ol style="margin-bottom: 0;">
                <li>Complete your profile setup</li>
                <li>Set your availability</li>
                <li>Start receiving job offers!</li>
            </ol>
        </div>
        
        <a href="https://fixelo.app/cleaner/dashboard" class="button">Go to Dashboard</a>
        
        <p>Need help getting started? Check out our <a href="https://fixelo.app/help">Help Center</a> or reply to this email.</p>
    `;

    return {
        to: '',
        subject: 'Welcome to Fixelo - Your Application is Approved!',
        html: wrapTemplate('Application Approved', content),
    };
}
