import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if we have the hash in the URL (handled by Supabase auth listener automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Invalid or expired reset link.');
        navigate('/auth/login');
      }
    });
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      return toast.error('Please enter a new password');
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Password updated successfully!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">New Password</h1>
        <p className="text-slate-500 font-medium">Please enter your new password below</p>
      </div>

      <form className="space-y-4" onSubmit={handleUpdate}>
        <Input 
          type="password" 
          placeholder="New Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        
        <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Password
        </Button>
      </form>
    </div>
  );
}
