import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../store";
import { api } from "../../lib/api";
import type { WSEvent, MatchFoundPayload } from "../../types";
import { wsClient } from "../../lib/ws";

export function ChallengeNotification() {
    const navigate = useNavigate();
    const {
        pendingChallenge,
        challengeDeclined,
        pendingRematch,
        rematchDeclined,
        setPendingChallenge,
        setChallengeDeclined,
        setPendingRematch,
        setRematchDeclined,
        startMatch,
        resetGame,
        setStatus,
        setMatchId,
    } = useGameStore();

    const handleChallengeAccept = async () => {
        if (!pendingChallenge) return;
        const LOBBY_ID = "00000000-0000-0000-0000-000000000000";
        let resolved = false;
        const onMatchFound = (e: WSEvent) => {
            if (resolved) return;
            resolved = true;
            const p = e.payload as MatchFoundPayload;
            setPendingChallenge(null);
            startMatch(p.match_id, false);
            wsClient.off("match_found", onMatchFound);
            navigate(`/game/${p.match_id}`, {
                state: { isPlayerA: p.is_player_a, isRanked: false },
            });
        };

        try {
            wsClient.on("match_found", onMatchFound);

            wsClient.connect(LOBBY_ID);
            await new Promise((r) => setTimeout(r, 200));

            const res = await api.respondChallenge(pendingChallenge.challenger_id, true);
            if (!resolved && res.match_id) {
                resolved = true;
                startMatch(res.match_id, false);
                wsClient.off("match_found", onMatchFound);
                setPendingChallenge(null);
                navigate(`/game/${res.match_id}`, {
                    state: { isPlayerA: false, isRanked: false },
                });
            }
        } catch (err) {
            console.error(err);
            wsClient.off("match_found", onMatchFound);
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

            // Register handler first
            const onMatchFound = (e: WSEvent) => {
                const p = e.payload as MatchFoundPayload;
                wsClient.off("match_found", onMatchFound);
                setPendingRematch(null);
                resetGame();
                setMatchId(p.match_id);
                setStatus("active");
                navigate(`/game/${p.match_id}`, {
                    state: { isPlayerA: p.is_player_a },
                });
            };
            wsClient.on("match_found", onMatchFound);

            // Wait for connection to be fully open BEFORE API call
            wsClient.connect(LOBBY_ID);
            await new Promise(r => setTimeout(r, 200)) // give socket time to open
            // Now API call — match_found will arrive after this
            await api.respondRematch(
                pendingRematch.match_id,
                pendingRematch.requester_id,
                true,
            );
        } catch (err) {
            console.error(err);
            wsClient.disconnect();
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

    if (
        !pendingChallenge &&
        !challengeDeclined &&
        !pendingRematch &&
        !rematchDeclined
    )
        return null;

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

            {challengeDeclined && !pendingChallenge && (
                <>
                    <p className="notification__text">
                        Opponent declined the challenge.
                    </p>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setChallengeDeclined(false)}
                    >
                        Dismiss
                    </button>
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
