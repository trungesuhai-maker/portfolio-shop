export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { orderId } = req.query;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ paid: false, error: 'Thiếu mã đơn hàng orderId' });
  }

  const cleanId = orderId.trim();
  const numericCode = parseInt(cleanId.replace(/\D/g, ''), 10);

  if (numericCode && !isNaN(numericCode)) {
    try {
      const clientId = process.env.PAYOS_CLIENT_ID || 'c2121c0c-5885-4bb0-98bb-3bb2b7829295';
      const apiKey = process.env.PAYOS_API_KEY || 'dd08ccd2-51cf-4374-a33e-aa5d90d42004';

      const payosCheck = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${numericCode}`, {
        headers: {
          'x-client-id': clientId,
          'x-api-key': apiKey
        }
      });
      const payosResult = await payosCheck.json();
      if (payosResult && payosResult.code === '00' && payosResult.data?.status === 'PAID') {
        return res.status(200).json({
          paid: true,
          status: 'success',
          payment: {
            orderId: cleanId,
            amount: payosResult.data.amountPaid || payosResult.data.amount || 0,
            currency: 'VND',
            provider: 'payos',
            status: 'success',
            paid: true,
            reference: payosResult.data.transactions?.[0]?.reference || 'PAYOS_DIRECT'
          }
        });
      }
    } catch (e) {
      // Ignore payOS query errors
    }
  }

  return res.status(200).json({ paid: false, status: 'pending' });
}
