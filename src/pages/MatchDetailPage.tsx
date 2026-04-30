import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MatchResultOverlay } from "../components/game/MatchResultOverlay";
import { useAuthStore } from "../store";
import { api } from "../lib/api";
import type { MatchSummary } from "../types";

export function MatchDetailPage() {
    const { matchId } = useParams<{ matchId: string }>();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [summary, setSummary] = useState<MatchSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isWinner, setIsWinner] = useState(false);
    const [isDraw, setIsDraw] = useState(false);
    const [isRanked, setIsRanked] = useState(true);

    useEffect(() => {
        if (!matchId || !user) return;
        setLoading(true);
        api.getMatchSummary(matchId)
            .then((s) => {
                setSummary(s);
                setIsRanked(s.is_ranked);
                if (!s.winner_id) {
                    setIsDraw(true);
                } else {
                    setIsWinner(s.winner_id === user.id);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [matchId, user]);

    if (!user) return null;

    return (
        <div className="match-detail-page">
            <button
                className="match-detail-page__back-btn"
                aria-label="Back to history"
                onClick={() => navigate("/history")}
            >
                &lt;
            </button>

            {loading ? (
                <div className="match-detail-page__loading">
                    <div className="queue-screen__spinner" />
                </div>
            ) : (
                <MatchResultOverlay
                    currentUserId={user.id}
                    isDraw={isDraw}
                    isWinner={isWinner}
                    isRanked={isRanked}
                    rematchSent={false}
                    challengeSent={false}
                    onRematch={() => {}}
                    onChallenge={() => {}}
                    onBackToLobby={() => navigate("/")}
                    summary={summary}
                    summaryLoading={loading}
                    isHistoryView={true}
                />
            )}
        </div>
    );
}
