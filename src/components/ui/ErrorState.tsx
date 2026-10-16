import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "An unexpected error occurred while loading this section.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <Card className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-red-50/50 border-red-100">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 border-red-200 text-red-600 hover:bg-red-50">
          Try Again
        </Button>
      )}
    </Card>
  );
}
