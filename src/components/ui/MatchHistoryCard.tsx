import type { MatchHistoryEntry } from "../../types";

interface Props {
    match: MatchHistoryEntry;
    onClick?: () => void;
    variant?: "default" | "home";
}

export function MatchHistoryCard({
    match,
    onClick,
    variant = "default",
}: Props) {
    const resultColor = {
        win: "history-card--win",
        loss: "history-card--loss",
        draw: "history-card--draw",
    }[match.result];

    const resultLabel = {
        win: "W",
        loss: "L",
        draw: "D",
    }[match.result];

    const date = match.finished_at
        ? new Date(match.finished_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
          })
        : "—";

    const modeLabel =
        match.game_mode.charAt(0).toUpperCase() + match.game_mode.slice(1);

    return (
        <div
            className={`history-card ${resultColor} ${variant === "home" ? "history-card--home" : ""}`}
            onClick={onClick}
        >
            <div className="history-card__result">{resultLabel}</div>
            <div className="history-card__info">
                <span className="history-card__opponent">
                    {variant === "home"
                        ? `${match.opponent_username}`
                        : match.opponent_username}
                </span>
                <span className="history-card__meta">
                    {variant === "home"
                        ? modeLabel
                        : `${match.game_mode} · ${match.is_ranked ? "Ranked" : "Private"} · ${match.word_count} words`}
                </span>
            </div>
            <div className="history-card__right">
                {variant !== "home" &&
                    match.is_ranked &&
                    match.elo_delta !== 0 && (
                        <span
                            className={`history-card__elo ${match.elo_delta > 0 ? "history-card__elo--pos" : "history-card__elo--neg"}`}
                        >
                            {match.elo_delta > 0 ? "+" : ""}
                            {match.elo_delta}
                        </span>
                    )}
                <span className="history-card__date">{date}</span>
            </div>
        </div>
    );
}
