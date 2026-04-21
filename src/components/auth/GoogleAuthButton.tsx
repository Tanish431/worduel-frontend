import { api } from "../../lib/api";

interface GoogleAuthButtonProps {
  disabled?: boolean;
  label?: string;
}

export function GoogleAuthButton({
  disabled = false,
  label = "Continue with Google",
}: GoogleAuthButtonProps) {
  const startGoogleAuth = () => {
    window.location.href = api.getGoogleAuthUrl();
  };

  return (
    <button
      type="button"
      className="btn btn--oauth"
      onClick={startGoogleAuth}
      disabled={disabled}
    >
      <span className="btn__oauth-icon" aria-hidden="true">
        G
      </span>
      {label}
    </button>
  );
}
