import { useEffect, useState } from "react";

type GuessFailureProps = {
    trigger: number;
};

export function GuessFailure({ trigger }: GuessFailureProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!trigger) return;

        setVisible(true);
        const timer = window.setTimeout(() => setVisible(false), 900);

        return () => window.clearTimeout(timer);
    }, [trigger]);

    if (!visible) return null;

    return (
        <div className="guess-failure" aria-hidden="true">
            <div className="guess-failure__flash">Miss!</div>
        </div>
    );
}
