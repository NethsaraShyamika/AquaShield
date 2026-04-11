import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error === "blocked") {
      // ✅ Redirect to login with blocked message
      navigate("/login?error=blocked");
      return;
    }

    if (error) {
      navigate("/login?error=google_failed");
      return;
    }

    if (token) {
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#020e1f] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🌊</div>
        <p className="text-white/50 text-sm">Signing you in with Google...</p>
        <div className="flex justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-cyan-400/50 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}