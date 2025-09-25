export const dynamic = 'force-dynamic';
import { AuthForm } from '@/components/auth/auth-form';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForm mode="signup" />
        <p className="text-center mt-4 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
