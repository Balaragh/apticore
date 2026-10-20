import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center font-sans text-[#172033]">
      <Logo size="lg" />
      <h1 className="mt-8 text-7xl font-black text-accent-600">404</h1>
      <h2 className="mt-2 text-2xl font-bold text-[#172033]">Page Not Found</h2>
      <p className="mt-2 text-xs text-[#64748B] max-w-sm">
        The requested URL was not found on the platform or has been relocated to another workspace.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={15} />} className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]">
            Back to Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button size="sm" leftIcon={<Home size={15} />} className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
