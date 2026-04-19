// AWS SNS SMS implementation (Free tier: 100 SMS/month for 12 months)
// More reliable than email-to-SMS gateways, works internationally

const AWS = require('aws-sdk');

// Configure AWS SNS (you'll need AWS credentials)
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1' // Change to your preferred region
});

const sns = new AWS.SNS();

// Send SMS via AWS SNS
const sendSMSViaAWS = async (phoneNumber, message) => {
  try {
    if (!phoneNumber || !message) {
      console.warn('⚠️  AWS SMS not sent - missing required fields');
      return null;
    }

    // Format phone number with country code (for Pakistan: +92)
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('+')) {
      // Assume Pakistan if no country code provided
      formattedNumber = `+92${formattedNumber.replace(/\D/g, '')}`;
    }

    const params = {
      Message: message,
      PhoneNumber: formattedNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional' // Use 'Promotional' for marketing
        }
      }
    };

    const result = await sns.publish(params).promise();
    console.log('✓ AWS SMS sent to:', formattedNumber, 'MessageId:', result.MessageId);
    return result;

  } catch (error) {
    console.error('✗ Error sending AWS SMS:', error.message);
    return null;
  }
};

module.exports = { sendSMSViaAWS };