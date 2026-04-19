# SMS Setup Guide for Pakistan

## Option 1: Free Email-to-SMS (Basic)
- ✅ Completely free
- ❌ Less reliable (carriers may block)
- ❌ No delivery confirmation

**Pakistani Carriers Supported:**
- Jazz: `03xxxxxxxxx@jazz.com.pk`
- Telenor: `03xxxxxxxxx@telenor.com.pk`
- Zong: `03xxxxxxxxx@zong.com.pk`
- Ufone: `03xxxxxxxxx@ufone.com.pk`

## Option 2: AWS SNS (Recommended)
- ✅ 100 SMS/month free for 12 months
- ✅ Works internationally
- ✅ Delivery confirmations
- ✅ More reliable

### AWS SNS Setup Steps:

1. **Create AWS Account** (if you don't have one):
   - Go to https://aws.amazon.com
   - Sign up for free account

2. **Get AWS Credentials**:
   - Go to AWS Console → IAM → Users
   - Create new user with SNS permissions
   - Get Access Key ID and Secret Access Key

3. **Configure SMS in Pakistan**:
   - AWS SNS works in Pakistan
   - Phone numbers should be in format: `+923xxxxxxxxx`

4. **Environment Variables** (add to `.env`):
   ```
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   ```

5. **Test SMS**:
   - Register employee with phone: `3xxxxxxxxx` (without +92)
   - System will automatically add +92 prefix
   - Create a fine to test SMS delivery

## Current Implementation

The system now:
1. Checks if AWS credentials are configured
2. If yes → Uses AWS SNS (reliable, international)
3. If no → Uses email-to-SMS (free, basic)

## Phone Number Format

**For Registration:**
- Enter as: `3xxxxxxxxx` (10 digits, no spaces/dashes)
- System adds +92 automatically for AWS SNS

**Supported Carriers:**
- jazz, telenor, zong, ufone, warid, mobilink, ptcl

## Cost Comparison

| Method | Cost | Reliability | Setup |
|--------|------|-------------|-------|
| Email-to-SMS | Free | Medium | None |
| AWS SNS | Free tier (100/month) | High | AWS account |
| Twilio | Paid | High | Credit card |

Would you like me to help you set up AWS SNS?