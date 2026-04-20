import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../store";
import { api } from "../../lib/api";
import type { WSEvent, MatchFoundPayload } from "../../types";
import { wsClient } from "../../lib/ws";

export function ChallengeNotification() {
    const navigate = useNavigate();
    const {
        pendingChallenge,
        pendingRematch,
        rematchDeclined,
        setPendingChallenge,
        setPendingRematch,
        setRematchDeclined,
        startMatch,
    } = useGameStore();

    const handleChallengeAccept = async () => {
        if (!pendingChallenge) return;
        try {
            const LOBBY_ID = "00000000-0000-0000-0000-000000000000";
            wsClient.connect(LOBBY_ID);
            const onMatchFound = (e: WSEvent) => {
                const p = e.payload as MatchFoundPayload;
                startMatch(p.match_id, false);
                wsClient.off("match_found", onMatchFound);
                wsClient.disconnect();
                navigate(`/game/${p.match_id}`, {
                    state: { isPlayerA: p.is_player_a, isRanked: false },
                });
            };
            wsClient.on("match_found", onMatchFound);
            await api.respondChallenge(pendingChallenge.challenger_id, true);
            setPendingChallenge(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChallengeDecline = async () => {
        if (!pendingChallenge) return;
        try {
            await api.respondChallenge(pendingChallenge.challenger_id, false);
            setPendingChallenge(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRematchAccept = async () => {
        if (!pendingRematch) return;
        try {
            const LOBBY_ID = "00000000-0000-0000-0000-000000000000";
            wsClient.connect(LOBBY_ID);
            const onMatchFound = (e: WSEvent) => {
                const p = e.payload as MatchFoundPayload;
                startMatch(p.match_id, false);
                wsClient.off("match_found", onMatchFound);
                wsClient.disconnect();
                navigate(`/game/${p.match_id}`, {
                    state: { isPlayerA: p.is_player_a, isRanked: false },
                });
            };
            wsClient.on("match_found", onMatchFound);
            await api.respondRematch(
                pendingRematch.match_id,
                pendingRematch.requester_id,
                true,
            );
            setPendingRematch(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRematchDecline = async () => {
        if (!pendingRematch) return;
        try {
            await api.respondRematch(
                pendingRematch.match_id,
                pendingRematch.requester_id,
                false,
            );
            setPendingRematch(null);
        } catch (err) {
            console.error(err);
        }
    };

    if (!pendingChallenge && !pendingRematch && !rematchDeclined) return null;

    return (
        <div className="notification">
            {pendingChallenge && (
                <>
                    <p className="notification__text">
                        <strong>{pendingChallenge.challenger_username}</strong>{" "}
                        challenged you!
                    </p>
                    <div className="notification__actions">
                        <button
                            className="btn btn--primary btn--sm"
                            onClick={handleChallengeAccept}
                        >
                            Accept
                        </button>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={handleChallengeDecline}
                        >
                            Decline
                        </button>
                    </div>
                </>
            )}

            {pendingRematch && (
                <>
                    <p className="notification__text">
                        Opponent wants a rematch!
                    </p>
                    <div className="notification__actions">
                        <button
                            className="btn btn--primary btn--sm"
                            onClick={handleRematchAccept}
                        >
                            Accept
                        </button>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={handleRematchDecline}
                        >
                            Decline
                        </button>
                    </div>
                </>
            )}

            {rematchDeclined && !pendingRematch && (
                <>
                    <p className="notification__text">
                        Opponent declined the rematch.
                    </p>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setRematchDeclined(false)}
                    >
                        Dismiss
                    </button>
                </>
            )}
        </div>
    );
}
