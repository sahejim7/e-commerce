import AuthForm from "@/components/AuthForm";
import { signIn } from "@/lib/auth/actions";

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AuthForm mode="sign-in" onSubmit={signIn} />
    </div>
  );
}
