import { useEffect, useState } from "react";
import {
    useParams,
    Navigate,
    useNavigate,
    useLocation,
} from "react-router-dom";
import { GameBoard } from "../components/game/GameBoard";
import { Keyboard } from "../components/game/Keyboard";
import { OpponentPanel } from "../components/game/OpponentPanel";
import { HPBar } from "../components/game/HPBar";
import { MatchResultOverlay } from "../components/game/MatchResultOverlay";
import { useGame } from "../hooks/useGame";
import { useAuthStore, useGameStore } from "../store";
import { api } from "../lib/api";
import type { MatchSummary } from "../types";

const MAX_HP = 100;

export function GamePage() {
    const { matchId } = useParams<{ matchId: string }>();
    const { user, authReady } = useAuthStore();
    const { resetGame, opponentForfeited, isRanked, challengeDeclined, rematchDeclined, setChallengeDeclined, setRematchDeclined } =
        useGameStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [rematchSent, setRematchSent] = useState(false);
    const [challengeSent, setChallengeSent] = useState(false);
    const [isForfeiting, setIsForfeiting] = useState(false);
    const [summary, setSummary] = useState<MatchSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const resolvedMatchId = matchId ?? "";
    const isPlayerA = location.state?.isPlayerA ?? true;
    const routeIsRanked = location.state?.isRanked;

    const {
        currentInput,
        myGuesses,
        opponentResults,
        status,
        winnerId,
        myHP,
        opponentHP,
        error,
        letterStates,
        handleKey,
        maxGuesses,
        wordLength,
    } = useGame(resolvedMatchId, isPlayerA);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => handleKey(e.key);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleKey]);

    useEffect(() => {
        if (typeof routeIsRanked !== "boolean") return;
        useGameStore.setState({ isRanked: routeIsRanked });
    }, [routeIsRanked]);

    useEffect(() => {
        let cancelled = false;

        if (!matchId) return;

        const loadMatch = async () => {
            try {
                const match = await api.getMatch(matchId);
                if (cancelled) return;
                useGameStore.setState({ isRanked: match.is_ranked });
            } catch (err) {
                console.error(err);
            }
        };

        loadMatch();

        return () => {
            cancelled = true;
        };
    }, [matchId]);

    useEffect(() => {
        setRematchSent(false);
        setChallengeSent(false);
        setIsForfeiting(false);
        setSummary(null);
        setSummaryLoading(false);
    }, [matchId]);

    useEffect(() => {
        if (!rematchDeclined) return;
        setRematchSent(false);
        setRematchDeclined(false);
    }, [rematchDeclined, setRematchDeclined]);

    useEffect(() => {
        if (!challengeDeclined) return;
        setChallengeSent(false);
        setChallengeDeclined(false);
    }, [challengeDeclined, setChallengeDeclined]);

    const isFinished = status === "finished";
    const isWinner = winnerId === user?.id;

    useEffect(() => {
        if (!isFinished || !matchId) return;

        let cancelled = false;
        setSummaryLoading(true);

        const loadSummary = async () => {
            try {
                const nextSummary = await api.getMatchSummary(matchId);
                if (cancelled) return;
                setSummary(nextSummary);
                useGameStore.setState({ isRanked: nextSummary.is_ranked });
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setSummaryLoading(false);
            }
        };

        loadSummary();

        return () => {
            cancelled = true;
        };
    }, [isFinished, matchId]);

    if (!authReady) return null;
    if (!user || !matchId) return <Navigate to="/" replace />;

    const handleForfeit = async () => {
        if (!matchId || isFinished || isForfeiting) return;

        try {
            setIsForfeiting(true);
            await api.forfeitMatch(matchId);
        } catch (err) {
            console.error(err);
            setIsForfeiting(false);
        }
    };

    const handleRematch = async () => {
        if (!matchId) return;
        try {
            await api.requestRematch(matchId);
            setRematchSent(true);
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleChallenge = async (opponentUsername: string) => {
        try {
            setChallengeDeclined(false);
            await api.challengeUser(opponentUsername);
            setChallengeSent(true);
        } catch (err: any) {
            console.error(err);
        }
    };

    return (
        <div className="game-page">
            <header className="game-page__header">
                <h1 className="game-page__title">Worduel</h1>
                <button
                    className="btn btn--ghost btn--sm"
                    onClick={handleForfeit}
                    disabled={isFinished || isForfeiting}
                >
                    {isForfeiting ? "Forfeiting..." : "Forfeit"}
                </button>
            </header>

            <div className="game-page__hp-bars">
                <HPBar hp={myHP} maxHP={MAX_HP} label="You" />
                {!opponentForfeited ? (
                    <HPBar hp={opponentHP} maxHP={MAX_HP} label="Opp" flip />
                ) : (
                    <p className="hp-bar__forfeited">Opponent forfeited</p>
                )}
            </div>

            {error && <p className="game-page__error">{error}</p>}

            <div className="game-page__boards">
                <GameBoard
                    guesses={myGuesses}
                    currentInput={currentInput}
                    maxGuesses={maxGuesses}
                    wordLength={wordLength}
                />
                <OpponentPanel
                    opponentResults={opponentResults}
                    maxGuesses={maxGuesses}
                    wordLength={wordLength}
                />
            </div>

            <Keyboard letterStates={letterStates} onKey={handleKey} />

            {isFinished && (
                <MatchResultOverlay
                    currentUserId={user.id}
                    isWinner={!!isWinner}
                    isRanked={routeIsRanked === false ? false : isRanked}
                    rematchSent={rematchSent}
                    challengeSent={challengeSent}
                    onRematch={handleRematch}
                    onChallenge={handleChallenge}
                    onBackToLobby={() => {
                        resetGame();
                        navigate("/");
                    }}
                    summary={summary}
                    summaryLoading={summaryLoading}
                />
            )}
        </div>
    );
}
