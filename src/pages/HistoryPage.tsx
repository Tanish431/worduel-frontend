import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import type { MatchHistoryEntry } from "../types";
import { api } from "../lib/api";
import { MatchHistoryCard } from "../components/ui/MatchHistoryCard";

const LIMIT = 10;

export function HistoryPage() {
    const navigate = useNavigate();

    const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);

    const [result, setResult] = useState<"win" | "loss" | "draw" | "">("");
    const [gameMode, setGameMode] = useState<"easy" | "hard" | "">("");
    const [isRanked, setIsRanked] = useState<"true" | "false" | "">("");
    const [opponent, setOpponent] = useState("");
    const [dateRange, setDateRange] = useState<"week" | "month" | "all" | "">(
        "",
    );

    const fetchMatches = async (newOffset = 0) => {
        setLoading(true);
        try {
            const res = await api.getHistory({
                limit: LIMIT,
                offset: newOffset,
                result: result || undefined,
                game_mode: gameMode || undefined,
                is_ranked: isRanked === "" ? undefined : isRanked === "true",
                opponent: opponent || undefined,
                date_range: dateRange || undefined,
            });
            setMatches(res.matches);
            setTotal(res.total);
            setOffset(newOffset);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchMatches(0);
    }, [result, gameMode, isRanked, dateRange]);

    const handleOpponentSearch = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") fetchMatches(0);
    };

    return (
        <div className="history-page">
            <header className="history-page__header">
                <button
                    className="match-detail-page__back-btn history-page__back-btn"
                    aria-label="Back to home"
                    onClick={() => navigate("/")}
                >
                    &lt;
                </button>
                <h1 className="history-page__title">Match History</h1>
            </header>

            <div className="history-page__filters">
                <select
                    className="filter-select"
                    value={result}
                    onChange={(e) => setResult(e.target.value as any)}
                >
                    <option value="">All Results</option>
                    <option value="win">Wins</option>
                    <option value="loss">Losses</option>
                    <option value="draw">Draws</option>
                </select>

                <select
                    className="filter-select"
                    value={gameMode}
                    onChange={(e) => setGameMode(e.target.value as any)}
                >
                    <option value="">All Modes</option>
                    <option value="easy">Easy</option>
                    <option value="hard">Hard</option>
                </select>

                <select
                    className="filter-select"
                    value={isRanked}
                    onChange={(e) => setIsRanked(e.target.value as any)}
                >
                    <option value="">All Types</option>
                    <option value="true">Ranked</option>
                    <option value="false">Private</option>
                </select>

                <select
                    className="filter-select"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                >
                    <option value="">All Time</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                </select>

                <input
                    className="input filter-input"
                    placeholder="Search opponent…"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    onKeyDown={handleOpponentSearch}
                />
            </div>

            <div className="history-page__list">
                {loading ? (
                    <div className="history-page__loading">
                        <div className="queue-screen__spinner" />
                    </div>
                ) : matches.length === 0 ? (
                    <p className="history-page__empty">No matches found.</p>
                ) : (
                    matches.map((match) => (
                        <MatchHistoryCard
                            key={match.match_id}
                            match={match}
                            onClick={() =>
                                navigate(`/history/${match.match_id}`)
                            }
                        />
                    ))
                )}
            </div>

            {total > LIMIT && (
                <div className="history-page__pagination">
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => fetchMatches(offset - LIMIT)}
                        disabled={offset === 0}
                    >
                        ← Prev
                    </button>
                    <span className="history-page__page">
                        {Math.floor(offset / LIMIT) + 1} /{" "}
                        {Math.ceil(total / LIMIT)}
                    </span>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => fetchMatches(offset + LIMIT)}
                        disabled={offset + LIMIT >= total}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
