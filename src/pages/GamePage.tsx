import { useEffect, useState } from "react";
import { wsClient } from "../lib/ws";
import type { WSEvent, MatchFoundPayload } from "../types";
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
import { OpponentSplash } from "../components/game/OpponentSplash";
import { GuessCelebration } from "../components/game/GuessCelebration";
import { GuessFailure } from "../components/game/GuessFailure";
import { MatchResultOverlay } from "../components/game/MatchResultOverlay";
import { useGame } from "../hooks/useGame";
import { useAuthStore, useGameStore } from "../store";
import { api } from "../lib/api";
import type { MatchSummary } from "../types";

const MAX_HP = 100;

export function GamePage() {
    const { matchId } = useParams<{ matchId: string }>();
    const { user, authReady } = useAuthStore();
    const {
        resetGame,
        opponentForfeited,
        isRanked,
        challengeDeclined,
        rematchDeclined,
        setChallengeDeclined,
        setRematchDeclined,
        opponentUsername,
        setMatchId,
        setStatus,
        setWinner,
    } = useGameStore();
    const [showSplash, setShowSplash] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const [rematchSent, setRematchSent] = useState(false);
    const [challengeSent, setChallengeSent] = useState(false);
    const [isForfeiting, setIsForfeiting] = useState(false);
    const [summary, setSummary] = useState<MatchSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [matchStatus, setMatchStatus] = useState<"pending" | "active" | "finished">("active");
    const resolvedMatchId = matchId ?? "";
    const [isPlayerA, setIsPlayerA] = useState<boolean>(location.state?.isPlayerA ?? true);
    const routeIsRanked = location.state?.isRanked;
    const gameData = useGame(resolvedMatchId ?? "", isPlayerA, !pageLoading && !pageError && matchStatus === "active");

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
        solvedAt,
        failedAt,
        maxGuesses,
        wordLength,
    } = gameData;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => handleKey(e.key);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleKey]);

    useEffect(() => {
        let cancelled = false;

        if (!matchId || !user) return;

        const loadMatch = async () => {
            try {
                setPageLoading(true);
                setPageError(null);
                const [match, nextSummary] = await Promise.all([
                    api.getMatch(matchId),
                    api.getMatchSummary(matchId),
                ]);
                if (cancelled) return;

                const amPlayerA = match.player_a_id === user.id;
                const myWordIndex = amPlayerA ? match.player_a_word_idx : match.player_b_word_idx;
                const currentRound = nextSummary.rounds.find(
                    (round) => round.word_index === myWordIndex,
                );
                const myGuesses = amPlayerA
                    ? (currentRound?.player_a_guesses ?? [])
                    : (currentRound?.player_b_guesses ?? []);
                const opponentResults = (amPlayerA
                    ? (currentRound?.player_b_guesses ?? [])
                    : (currentRound?.player_a_guesses ?? [])
                ).map((guess) => guess.result);
                const opponentUsername = amPlayerA
                    ? nextSummary.player_b.username
                    : nextSummary.player_a.username;

                setIsPlayerA(amPlayerA);
                setMatchStatus(match.status);
                setSummary(nextSummary);
                useGameStore.setState({
                    matchId: match.id,
                    status: match.status,
                    winnerId: match.winner_id ?? null,
                    isRanked: match.is_ranked,
                    opponentUsername,
                    myHP: amPlayerA ? match.player_a_hp : match.player_b_hp,
                    opponentHP: amPlayerA ? match.player_b_hp : match.player_a_hp,
                    myGuesses,
                    opponentResults,
                    opponentForfeited: false,
                });
                if (match.status === "finished") {
                    setWinner(match.winner_id ?? null);
                }
            } catch (err) {
                console.error(err);
                if (cancelled) return;
                setPageError(err instanceof Error ? err.message : "Failed to load match");
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        };

        loadMatch();

        return () => {
            cancelled = true;
        };
    }, [matchId, setWinner, user]);

    useEffect(() => {
        setRematchSent(false);
        setChallengeSent(false);
        setIsForfeiting(false);
        setSummary(null);
        setSummaryLoading(false);
        setPageLoading(true);
        setPageError(null);
        setMatchStatus("active");
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
    const isDraw = isFinished && winnerId === null;
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
            const LOBBY_ID = "00000000-0000-0000-0000-000000000000";

            // Don't disconnect first — just switch to lobby room
            wsClient.connect(LOBBY_ID);

            const onMatchFound = (e: WSEvent) => {
                const p = e.payload as MatchFoundPayload;
                wsClient.off("match_found", onMatchFound);
                resetGame();
                setMatchId(p.match_id);
                setStatus("active");
                navigate(`/game/${p.match_id}`, {
                    state: { isPlayerA: p.is_player_a },
                });
            };
            wsClient.on("match_found", onMatchFound);
            wsClient.connect(LOBBY_ID)
            await new Promise(r => setTimeout(r, 200)) // give socket time to open
            await api.requestRematch(matchId);
            setRematchSent(true);
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleChallenge = async (opponentUsername: string) => {
        const LOBBY_ID = "00000000-0000-0000-0000-000000000000";
        const onMatchFound = (e: WSEvent) => {
            const p = e.payload as MatchFoundPayload;
            wsClient.off("match_found", onMatchFound);
            resetGame();
            setMatchId(p.match_id);
            setStatus("active");
            navigate(`/game/${p.match_id}`, {
                state: { isPlayerA: p.is_player_a, isRanked: false },
            });
        };

        try {
            setChallengeDeclined(false);
            wsClient.connect(LOBBY_ID);
            wsClient.on("match_found", onMatchFound);
            await api.challengeUser(opponentUsername);
            setChallengeSent(true);
        } catch (err: any) {
            wsClient.off("match_found", onMatchFound);
            console.error(err);
        }
    };

    if (!authReady) return null;

    if (!user || !matchId) {
        return <Navigate to="/" replace />;
    }

    if (pageLoading) {
        return (
            <div className="game-page game-page--loading">
                <p className="game-page__status">Loading match...</p>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="game-page game-page--loading">
                <p className="game-page__error">{pageError}</p>
                <button className="btn btn--ghost btn--sm" onClick={() => navigate("/")}>
                    Back to lobby
                </button>
            </div>
        );
    }

    return (
        <div className="game-page">
            <GuessCelebration trigger={solvedAt} />
            <GuessFailure trigger={failedAt} />
            {showSplash && opponentUsername && (
                <OpponentSplash
                    opponentUsername={opponentUsername}
                    onDone={() => setShowSplash(false)}
                />
            )}
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
                    shakeTrigger={failedAt}
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
                    isDraw={!!isDraw}
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
