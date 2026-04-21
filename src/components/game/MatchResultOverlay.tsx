import { useEffect, useState } from "react";
import type { Guess, MatchSummary } from "../../types";

interface MatchResultOverlayProps {
    currentUserId: string;
    isWinner: boolean;
    isRanked: boolean;
    rematchSent: boolean;
    challengeSent: boolean;
    onRematch: () => void;
    onChallenge: (opponentUsername: string) => void;
    onBackToLobby: () => void;
    summary: MatchSummary | null;
    summaryLoading: boolean;
}

function ChallengeConfirmModal({
    onConfirm,
    onCancel,
}: {
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="challenge-modal-overlay">
            <div className="challenge-modal">
                <h3 className="challenge-modal__title">Send Challenge?</h3>
                <p className="challenge-modal__message">
                    Challenges are <strong>unranked</strong> matches against this opponent. 
                    They can accept or decline your challenge.
                </p>
                <div className="challenge-modal__actions">
                    <button className="btn btn--primary btn--sm" onClick={onConfirm}>
                        Send Challenge
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function GuessChip({ guess }: { guess: Guess }) {
    return (
        <div className="result-overlay__guess">
            {guess.guess.split("").map((letter, index) => (
                <span
                    key={`${guess.id}-${index}`}
                    className={`result-overlay__guess-tile result-overlay__guess-tile--${guess.result[index] ?? "empty"}`}
                >
                    {letter.toUpperCase()}
                </span>
            ))}
        </div>
    );
}

export function MatchResultOverlay({
    currentUserId,
    isWinner,
    isRanked,
    rematchSent,
    challengeSent,
    onRematch,
    onChallenge,
    onBackToLobby,
    summary,
    summaryLoading,
}: MatchResultOverlayProps) {
    const rounds = summary?.rounds ?? [];
    const [activeRound, setActiveRound] = useState(0);
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    
    // Get opponent username
    const opponentUsername = currentUserId === summary?.player_a.id 
        ? summary?.player_b.username 
        : summary?.player_a.username;

    useEffect(() => {
        setActiveRound(0);
    }, [summary?.match_id]);

    useEffect(() => {
        if (rounds.length <= 1) return;

        const timer = window.setInterval(() => {
            setActiveRound((current) => (current + 1) % rounds.length);
        }, 2800);

        return () => window.clearInterval(timer);
    }, [rounds.length]);

    const currentRound = rounds[activeRound];
    const isUpcomingRound =
        !!currentRound &&
        currentRound.player_a_guesses.length === 0 &&
        currentRound.player_b_guesses.length === 0;
    const playerALabel =
        summary?.player_a.id === currentUserId ? "You" : (summary?.player_a.username ?? "Player A");
    const playerBLabel =
        summary?.player_b.id === currentUserId ? "You" : (summary?.player_b.username ?? "Player B");

    return (
        <div className="result-overlay">
            <div className="result-overlay__backdrop" />
            <div className="result-overlay__card">
                <div
                    className={`result-overlay__status result-overlay__status--${isWinner ? "win" : "lose"}`}
                >
                    {isWinner ? "Victory" : "Defeat"}
                </div>

                <p className="result-overlay__headline">
                    {isWinner ? "You won the duel." : "You lost the duel."}
                </p>

                <div className="result-overlay__summary">
                    {summaryLoading ? (
                        <p className="result-overlay__empty">Loading match summary…</p>
                    ) : !currentRound ? (
                        <p className="result-overlay__empty">
                            Match summary will appear here after the final word.
                        </p>
                    ) : (
                        <>
                            <div className="result-overlay__round-header">
                                <span className="result-overlay__round-label">
                                    {isUpcomingRound ? "Up Next" : `Word ${activeRound + 1}`}
                                </span>
                                <span className="result-overlay__target">
                                    {currentRound.target_word.toUpperCase()}
                                </span>
                            </div>

                            <div className="result-overlay__players">
                                <div className="result-overlay__player">
                                    <div className="result-overlay__player-label">
                                        {playerALabel}
                                    </div>
                                    <div className="result-overlay__guess-list">
                                        {currentRound.player_a_guesses.length > 0 ? (
                                            currentRound.player_a_guesses.map((guess) => (
                                                <GuessChip key={guess.id} guess={guess} />
                                            ))
                                        ) : (
                                            <p className="result-overlay__guess-empty">No guesses</p>
                                        )}
                                    </div>
                                </div>

                                <div className="result-overlay__player">
                                    <div className="result-overlay__player-label">
                                        {playerBLabel}
                                    </div>
                                    <div className="result-overlay__guess-list">
                                        {currentRound.player_b_guesses.length > 0 ? (
                                            currentRound.player_b_guesses.map((guess) => (
                                                <GuessChip key={guess.id} guess={guess} />
                                            ))
                                        ) : (
                                            <p className="result-overlay__guess-empty">No guesses</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {rounds.length > 1 && (
                                <div className="result-overlay__dots">
                                    {rounds.map((round, index) => (
                                        <button
                                            key={round.word_index}
                                            className={`result-overlay__dot ${index === activeRound ? "result-overlay__dot--active" : ""}`}
                                            onClick={() => setActiveRound(index)}
                                            aria-label={`Show round ${round.word_index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="result-overlay__actions">
                    {isRanked ? (
                        challengeSent ? (
                            <p className="result-overlay__waiting">Waiting for challenge…</p>
                        ) : (
                            <button className="btn btn--primary btn--sm" onClick={() => setShowChallengeModal(true)}>
                                Challenge
                            </button>
                        )
                    ) : (
                        !rematchSent && (
                            <button className="btn btn--primary btn--sm" onClick={onRematch}>
                                Rematch
                            </button>
                        )
                    )}
                    {isRanked && rematchSent && (
                        <p className="result-overlay__waiting">Waiting for rematch…</p>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={onBackToLobby}>
                        Back to lobby
                    </button>
                </div>

                {showChallengeModal && (
                    <ChallengeConfirmModal
                        onConfirm={() => {
                            setShowChallengeModal(false);
                            if (opponentUsername) {
                                onChallenge(opponentUsername);
                            }
                        }}
                        onCancel={() => setShowChallengeModal(false)}
                    />
                )}
            </div>
        </div>
    );
}
