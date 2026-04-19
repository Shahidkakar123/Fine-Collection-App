// SMS utility using email-to-SMS gateways (free but limited)
// This sends SMS by emailing to carrier-specific SMS gateways

const { sendEmail } = require('./email');

// Carrier SMS gateway mappings (US + Pakistan carriers)
const CARRIER_GATEWAYS = {
  // US Carriers
  'verizon': '@vtext.com',
  'att': '@txt.att.net',
  'tmobile': '@tmomail.net',
  'sprint': '@messaging.sprintpcs.com',
  'boost': '@sms.myboostmobile.com',
  'cricket': '@sms.cricketwireless.net',
  'metro': '@mymetropcs.com',
  'straighttalk': '@vtext.com',
  'tracfone': '@mmst5.tracfone.com',
  'virgin': '@vmobl.com',
  'uscellular': '@email.uscc.net',
  'mint': '@mailmymobile.net',

  // Pakistani Carriers
  'jazz': '@sms.jazz.com.pk',
  'telenor': '@sms.telenor.com.pk',
  'zong': '@sms.zong.com.pk',
  'ufone': '@sms.ufone.com.pk',
  'warid': '@sms.warid.com.pk',
  'mobilink': '@sms.mobilink.com.pk', // Alternative for Jazz
  'ptcl': '@sms.ptcl.com.pk'
};

// Send SMS via email-to-SMS gateway
const sendSMS = async (phoneNumber, carrier, message) => {
  try {
    if (!phoneNumber || !carrier || !message) {
      console.warn('⚠️  SMS not sent - missing required fields', { phoneNumber, carrier, message: message ? 'present' : 'missing' });
      return null;
    }

    const gateway = CARRIER_GATEWAYS[carrier.toLowerCase()];
    if (!gateway) {
      console.warn(`⚠️  SMS not sent - unsupported carrier: ${carrier}`);
      console.log('📋 Supported carriers:', Object.keys(CARRIER_GATEWAYS));
      return null;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      console.warn(`⚠️  SMS not sent - invalid phone number format. Length: ${cleanNumber.length} (expected 10)`, { original: phoneNumber, cleaned: cleanNumber });
      return null;
    }

    const smsEmail = cleanNumber + gateway;
    console.log('📧 SMS Gateway Email:', smsEmail);

    // Send as email to SMS gateway
    const result = await sendEmail(smsEmail, 'Fine Notification', message);
    if (result) {
      console.log('✓ SMS sent successfully to:', smsEmail);
    } else {
      console.warn('⚠️  Email service failed, SMS may not be delivered');
    }
    return result;

  } catch (error) {
    console.error('✗ Error sending SMS:', error.message);
    return null;
  }
};

// Get list of supported carriers
const getSupportedCarriers = () => {
  return Object.keys(CARRIER_GATEWAYS);
};

module.exports = { sendSMS, getSupportedCarriers, CARRIER_GATEWAYS };