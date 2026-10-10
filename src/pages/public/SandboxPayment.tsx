import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Loading } from '@/src/components/ui/Loading';
import { CheckCircle2, Shield, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SandboxPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError('Invalid payment session. Missing Order ID.');
    }
  }, [orderId]);

  const handlePay = async (status: 'success' | 'failed') => {
    setProcessing(true);
    
    try {
      // 1. Post to backend to verify payment
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          payload: { status }
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      // Payment successful
      setSuccess(true);
      toast.success('Payment verified successfully!');
      
      // Give them a moment to see the success screen
      setTimeout(() => {
        navigate('/dashboard/portfolios');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
      toast.error('Payment verification failed');
    } finally {
      setProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-soft max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Failed</h2>
          <p className="text-slate-500">{error}</p>
          <Button className="w-full mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-soft max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
          <p className="text-slate-500">Your Portfolio Instance has been created. Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center space-y-2">
          <Shield className="w-8 h-8 mx-auto text-brand-400 mb-2" />
          <h2 className="text-lg font-bold">Sandbox Payment Gateway</h2>
          <p className="text-slate-400 text-sm">Test Environment - No real charges will be made</p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-slate-100">
             <span className="text-slate-500 font-medium">Order ID</span>
             <span className="font-bold text-slate-900">{orderId}</span>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-slate-100">
             <span className="text-slate-500 font-medium">Total Amount</span>
             <span className="font-black text-3xl text-brand-600">${amount}</span>
          </div>

          <div className="pt-4 space-y-3">
             <Button 
               className="w-full h-14 text-lg font-bold gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-soft-md shadow-emerald-500/20"
               onClick={() => handlePay('success')}
               disabled={processing}
             >
               {processing ? <Loading /> : 'Simulate Success'}
             </Button>
             
             <Button 
               variant="outline"
               className="w-full h-14 text-lg font-bold text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
               onClick={() => handlePay('failed')}
               disabled={processing}
             >
               Simulate Failure
             </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
