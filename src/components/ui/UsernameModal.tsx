import { useState } from "react";
import { api } from "../../lib/api";
import { formatErrorMessage } from "../../lib/errors";

interface Props {
    currentUsername: string;
    onClose: () => void;
    onSave: (username: string) => void;
}

export function UsernameModal({
    currentUsername,
    onClose,
    onSave,
}: Props) {
    const [username, setUsername] = useState(currentUsername);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const trimmedUsername = username.trim();
    const unchanged = trimmedUsername === currentUsername;

    const handleSubmit = async () => {
        if (!trimmedUsername || unchanged) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.updateUsername(trimmedUsername);
            onSave(response.username);
            onClose();
        } catch (err: any) {
            setError(formatErrorMessage(err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal modal--compact"
                onClick={(event) => event.stopPropagation()}
            >
                <button className="modal__close" onClick={onClose}>
                    ✕
                </button>
                <div className="modal__content modal__content--stretch">
                    <h2 className="modal__title">Change username</h2>
                    <p className="modal__desc">
                        Pick the name other players will see in matches and
                        challenges.
                    </p>
                    {error && <p className="auth-card__error">{error}</p>}
                    <input
                        className="input"
                        autoFocus
                        maxLength={24}
                        placeholder="Username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                handleSubmit();
                            }
                        }}
                    />
                    <div className="modal__actions">
                        <button
                            className="btn btn--ghost"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn--primary"
                            onClick={handleSubmit}
                            disabled={loading || !trimmedUsername || unchanged}
                        >
                            {loading ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
