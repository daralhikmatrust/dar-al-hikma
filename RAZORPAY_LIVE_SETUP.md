# Razorpay Test to Live Mode Conversion Guide

## Overview
This guide will help you convert your Razorpay integration from test mode to live mode.

## Prerequisites
1. Razorpay account (sign up at https://razorpay.com)
2. Business verification documents ready
3. Bank account details for settlements

## Step 1: Complete Business Verification

1. **Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com
   - Login with your account

2. **Complete KYC**
   - Navigate to **Settings** → **Account & Settings**
   - Complete business verification:
     - Business details
     - Bank account details
     - Business documents (GST, PAN, etc.)
     - Authorized signatory details

3. **Wait for Approval**
   - Razorpay will review your documents (usually 24-48 hours)
   - You'll receive email confirmation when approved

## Step 2: Get Live API Keys

1. **Access API Keys**
   - Go to **Settings** → **API Keys**
   - You'll see two sections:
     - **Test Mode Keys** (currently using)
     - **Live Mode Keys** (activate after verification)

2. **Generate Live Keys**
   - Click on **Generate Live Keys**
   - Copy both:
     - **Key ID** (starts with `rzp_live_...`)
     - **Key Secret** (starts with `rzp_live_...`)

## Step 3: Update Environment Variables

### Frontend (.env file)
```env
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
```

### Backend (.env file)
```env
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
```

## Step 4: Update Backend Code

### Check your backend Razorpay configuration:

**File: `backend/controllers/donation.controller.js`** (or similar)

```javascript
const razorpay = require('razorpay');

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Will use live key from .env
  key_secret: process.env.RAZORPAY_KEY_SECRET // Will use live secret from .env
});
```

## Step 5: Test in Live Mode

1. **Use Test Amounts First**
   - Start with small amounts (₹1, ₹10)
   - Verify payments are processing correctly

2. **Check Webhooks**
   - Ensure webhook URLs are updated for live mode
   - Test payment callbacks

3. **Verify Settlements**
   - Check that funds are settling to your bank account
   - Settlement time: T+2 days (2 business days after payment)

## Step 6: Important Differences

### Test Mode vs Live Mode

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Key ID Prefix | `rzp_test_` | `rzp_live_` |
| Payments | Fake/test | Real money |
| Webhooks | Test webhooks | Production webhooks |
| Settlements | No settlements | Real bank transfers |
| Refunds | Test only | Real refunds |

## Step 7: Security Best Practices

1. **Never Commit Keys to Git**
   - Keep `.env` files in `.gitignore`
   - Use environment variables in production

2. **Use Different Keys for Different Environments**
   - Development: Test keys
   - Staging: Test keys
   - Production: Live keys

3. **Rotate Keys Periodically**
   - Change keys every 6-12 months
   - Update immediately if compromised

## Step 8: Monitoring

1. **Dashboard Monitoring**
   - Monitor transactions in Razorpay dashboard
   - Set up email alerts for failed payments

2. **Webhook Monitoring**
   - Monitor webhook delivery
   - Set up retry mechanisms

## Troubleshooting

### Issue: Payments not processing
- **Solution**: Verify live keys are correctly set in environment variables
- **Check**: Ensure business verification is complete

### Issue: Webhooks not working
- **Solution**: Update webhook URLs in Razorpay dashboard
- **Check**: Verify webhook endpoint is accessible from internet

### Issue: Settlements delayed
- **Solution**: Check bank account details are correct
- **Note**: T+2 settlement is normal

## Support

- Razorpay Support: support@razorpay.com
- Documentation: https://razorpay.com/docs/
- Dashboard: https://dashboard.razorpay.com

## Checklist

- [ ] Business verification completed
- [ ] Live API keys generated
- [ ] Environment variables updated
- [ ] Backend code verified
- [ ] Test payments successful
- [ ] Webhooks configured
- [ ] Monitoring set up
- [ ] Security measures in place

---

**Important**: Always test thoroughly in test mode before switching to live mode. Once in live mode, all transactions involve real money.
