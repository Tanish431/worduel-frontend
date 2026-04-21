import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store";

export function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finishGoogleAuth = async () => {
      const oauthError = searchParams.get("error");
      const token = searchParams.get("token");

      if (oauthError) {
        setError(oauthError);
        return;
      }

      try {
        if (token) {
          const user = await api.getMeWithToken(token);
          if (cancelled) return;
          setAuth(user, token);
          navigate("/", { replace: true });
          return;
        }

        setError("Google sign-in did not return the required credentials.");
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message ?? "Google sign-in failed.");
      }
    };

    finishGoogleAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, setAuth]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Google Sign-In</h2>
        {error ? (
          <>
            <p className="auth-card__error">{error}</p>
            <button className="btn btn--primary" onClick={() => navigate("/login", { replace: true })}>
              Back to login
            </button>
          </>
        ) : (
          <p className="auth-card__status">Finishing your Google sign-in…</p>
        )}
      </div>
    </div>
  );
}
