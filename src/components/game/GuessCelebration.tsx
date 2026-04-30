import { useEffect, useState, type CSSProperties } from "react";

const CONFETTI_COUNT = 18;
const DRIFTS = [-120, 95, -80, 140, -55, 70, -150, 115, -35, 45, -100, 130, -68, 82, -24, 58, -92, 108];
const DURATIONS = [1280, 1460, 1360, 1540, 1320, 1490, 1600, 1420, 1260, 1520, 1380, 1580, 1340, 1470, 1290, 1510, 1400, 1560];

type GuessCelebrationProps = {
    trigger: number;
};

export function GuessCelebration({ trigger }: GuessCelebrationProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!trigger) return;

        setVisible(true);
        const timer = window.setTimeout(() => setVisible(false), 1700);

        return () => window.clearTimeout(timer);
    }, [trigger]);

    if (!visible) return null;

    return (
        <div className="guess-celebration" aria-hidden="true">
            <div className="guess-celebration__flash">Nice!</div>
            {Array.from({ length: CONFETTI_COUNT }).map((_, index) => (
                <span
                    key={index}
                    className="guess-celebration__piece"
                    style={
                        {
                            "--confetti-index": index,
                            "--confetti-left": `${10 + index * 4.5}%`,
                            "--confetti-rotate": `${index * 19}deg`,
                            "--confetti-drift": `${DRIFTS[index]}px`,
                            "--confetti-duration": `${DURATIONS[index]}ms`,
                        } as CSSProperties
                    }
                />
            ))}
        </div>
    );
}
