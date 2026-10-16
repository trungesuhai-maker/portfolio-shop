import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-client-id, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const clientId = process.env.PAYOS_CLIENT_ID || 'c2121c0c-5885-4bb0-98bb-3bb2b7829295';
    const apiKey = process.env.PAYOS_API_KEY || 'dd08ccd2-51cf-4374-a33e-aa5d90d42004';
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY || 'd61a7decd1193bc851d69344fbfd2844a90d5f764e1ee1c5ae0565ae22b91595';

    const { amount, description, orderCode: reqOrderCode, returnUrl: reqReturnUrl, cancelUrl: reqCancelUrl } = req.body || {};

    const numericAmount = Math.max(1000, Number(amount) || 2000);
    // payOS orderCode must be an integer between 1 and 9007199254740991
    let orderCode = Number(reqOrderCode);
    if (!orderCode || isNaN(orderCode) || orderCode <= 0) {
      orderCode = Math.floor(100000 + Math.random() * 899000);
    }

    // payOS description max 25 chars, alphanumeric and spaces only
    let cleanDesc = (description || `PORTFOLIO ${orderCode}`)
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .substring(0, 25);
    if (!cleanDesc) cleanDesc = `ORD ${orderCode}`;

    const host = req.headers.host ? `https://${req.headers.host}` : 'https://www.webcuaban.site';
    const returnUrl = reqReturnUrl || `${host}/checkout?orderCode=${orderCode}&status=success`;
    const cancelUrl = reqCancelUrl || `${host}/checkout?orderCode=${orderCode}&status=cancel`;

    // Sign payload for payOS (keys sorted alphabetically: amount, cancelUrl, description, orderCode, returnUrl)
    const signData = `amount=${numericAmount}&cancelUrl=${cancelUrl}&description=${cleanDesc}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    const signature = crypto.createHmac('sha256', checksumKey).update(signData).digest('hex');

    const payosResponse = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderCode,
        amount: numericAmount,
        description: cleanDesc,
        cancelUrl,
        returnUrl,
        signature
      })
    });

    const result = await payosResponse.json();

    if (result && result.code === '00' && result.data) {
      const data = result.data;
      return res.status(200).json({
        success: true,
        orderCode,
        amount: numericAmount,
        checkoutUrl: data.checkoutUrl,
        qrCode: data.qrCode,
        qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(data.qrCode)}`,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        description: data.description,
        paymentLinkId: data.paymentLinkId
      });
    } else {
      console.warn('payOS API warning:', result);
      return res.status(200).json({
        success: false,
        orderCode,
        amount: numericAmount,
        message: result?.desc || 'Không thể tạo link qua payOS API',
        error: result
      });
    }
  } catch (err: any) {
    console.error('payOS creation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Lỗi server khi tạo link payOS'
    });
  }
}
