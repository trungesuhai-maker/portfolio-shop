export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-payos-signature, x-webhook-signature'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle payOS webhook verification ping
  if (req.body?.webhookUrl || req.body?.test === true) {
    return res.status(200).json({ 
      success: true, 
      code: "00", 
      message: "payOS Webhook URL confirmed successfully" 
    });
  }

  // Handle payOS payment notification
  if (req.body?.data && (req.body.code === '00' || req.body.desc === 'success')) {
    const payData = req.body.data;
    const orderCode = String(payData.orderCode || '');
    const amount = payData.amount || 0;

    return res.status(200).json({
      success: true,
      code: "00",
      orderCode,
      amount,
      message: "Payment webhook processed successfully"
    });
  }

  return res.status(200).json({
    success: true,
    code: "00",
    message: "Webhook received"
  });
}
