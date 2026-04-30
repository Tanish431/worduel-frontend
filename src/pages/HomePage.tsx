import { useState, useEffect, useRef } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { FiEdit2 } from "react-icons/fi";
import { useMatchmaking } from "../hooks/useMatchmaking";
import { useAuthStore, useGameStore } from "../store";
import { PrivateMatchModal } from "../components/ui/PrivateMatchModal";
import { UsernameModal } from "../components/ui/UsernameModal";
import { api } from "../lib/api";
import type { MatchHistoryEntry } from "../types";
import { MatchHistoryCard } from "../components/ui/MatchHistoryCard";

export function HomePage() {
    const { resetGame } = useGameStore();
    const { user, authReady, clearAuth, setUser } = useAuthStore();
    const { joinQueue, leaveQueue, isQueuing, timedOut } = useMatchmaking();
    const [showPrivate, setShowPrivate] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { selectedMode, setSelectedMode } = useGameStore();
    const [stats, setStats] = useState({
        connected_users: 0,
        users_in_game: 0,
    });
    const [recentMatches, setRecentMatches] = useState<MatchHistoryEntry[]>([]);
    const navigate = useNavigate();
    const userMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        resetGame();
        const fetchStats = async () => {
            try {
                const s = await api.getStats();
                setStats(s);
            } catch {
                /* ignore */
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user) return;
        api.getHistory({ limit: 5 })
            .then((res) => {
                setRecentMatches(res.matches);
            })
            .catch(() => {});
    }, [user]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!userMenuRef.current?.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, []);

    if (!authReady) return null;
    if (!user) return <Navigate to="/login" replace />;
    return (
        <div className="home-page">
            <header className="home-page__header">
                <h1>Worduel</h1>
                <div className="home-page__user-menu" ref={userMenuRef}>
                    <button
                        type="button"
                        className="home-page__user-trigger"
                        aria-label="Open user menu"
                        aria-expanded={showUserMenu}
                        onClick={() => setShowUserMenu((open) => !open)}
                    >
                        <span className="home-page__user-icon" aria-hidden="true">
                            <span className="home-page__user-icon-head" />
                            <span className="home-page__user-icon-body" />
                        </span>
                    </button>
                    {showUserMenu && (
                        <div className="home-page__user-dropdown">
                            <div className="home-page__user">
                                <div className="home-page__user-row">
                                    <span className="home-page__username">
                                        {user.username}
                                    </span>
                                    <button
                                        type="button"
                                        className="home-page__username-edit"
                                        aria-label="Change username"
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            setShowUsernameModal(true);
                                        }}
                                    >
                                        <FiEdit2 aria-hidden="true" />
                                    </button>
                                </div>
                                <span className="home-page__elo">
                                    ELO {user.elo}
                                </span>
                            </div>
                            <button
                                className="btn btn--ghost home-page__logout"
                                onClick={clearAuth}
                            >
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {user.is_guest && (
                <div className="guest-banner">
                    🎮 Playing as guest —{" "}
                    <Link to="/register">create an account</Link> to save your
                    progress
                </div>
            )}

            <div className="home-page__content">
                <p className="lobby__stats">
                    🟢 {stats.connected_users} online · ⚔️ {stats.users_in_game}{" "}
                    in game
                </p>
                <aside className="home-page__sidebar">
                    <div className="sidebar__header">
                        <span className="sidebar__title">Recent Matches</span>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => navigate("/history")}
                        >
                            See all
                        </button>
                    </div>
                    {recentMatches.length === 0 ? (
                        <p className="sidebar__empty">No matches yet.</p>
                    ) : (
                        recentMatches.map((match) => (
                            <MatchHistoryCard
                                key={match.match_id}
                                match={match}
                                variant="home"
                            />
                        ))
                    )}
                </aside>

                <main className="home-page__main">
                    {isQueuing ? (
                        <div className="queue-screen">
                            <div className="queue-screen__spinner" />
                            <p className="queue-screen__label">Finding opponent…</p>
                            <p className="queue-screen__timer">Giving up in 90s</p>
                            <button
                                className="btn btn--secondary"
                                onClick={leaveQueue}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : timedOut ? (
                        <div className="lobby">
                            <p className="queue-screen__label">
                                No opponent found. Try again.
                            </p>
                            <button
                                className="btn btn--primary btn--lg"
                                onClick={() => {
                                    useGameStore.getState().setStatus("idle");
                                    joinQueue();
                                }}
                            >
                                Try Again
                            </button>
                            <button
                                className="btn btn--ghost"
                                onClick={() =>
                                    useGameStore.getState().setStatus("idle")
                                }
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="lobby">
                            <p className="lobby__tagline">
                                1v1 Wordle. Real-time. Ranked.
                            </p>
                            <button
                                className="btn btn--primary btn--lg"
                                onClick={joinQueue}
                            >
                                Find Match
                            </button>
                            <button
                                className="btn btn--ghost"
                                onClick={() => setShowPrivate(true)}
                            >
                                Private Match
                            </button>
                            <div className="mode-toggle">
                                <button
                                    className={`mode-toggle__btn ${selectedMode === "easy" ? "mode-toggle__btn--active" : ""}`}
                                    onClick={() => setSelectedMode("easy")}
                                >
                                    Easy
                                </button>
                                <button
                                    className={`mode-toggle__btn ${selectedMode === "hard" ? "mode-toggle__btn--active" : ""}`}
                                    onClick={() => setSelectedMode("hard")}
                                >
                                    Hard
                                </button>
                            </div>
                        </div>
                    )}
                </main>

                <div className="home-page__rail" aria-hidden="true" />
            </div>

            {showPrivate && (
                <PrivateMatchModal onClose={() => setShowPrivate(false)} />
            )}
            {showUsernameModal && (
                <UsernameModal
                    currentUsername={user.username}
                    onClose={() => setShowUsernameModal(false)}
                    onSave={(username) =>
                        setUser({
                            ...user,
                            username,
                        })
                    }
                />
            )}
        </div>
    );
}
