import { useEffect, useMemo, useState } from "react";

type WarriorProgressBarProps = {
  earned: number;
  total: number;
  label?: string;
  showFlame?: boolean;
  animated?: boolean;
  showPercentage?: boolean;
};

export function WarriorProgressBar({
  earned,
  total,
  label = "Warrior medal completion",
  showFlame = true,
  animated = true,
  showPercentage = true,
}: WarriorProgressBarProps) {
  const percentage = useMemo(() => {
    if (total <= 0) {
      return 0;
    }

    return Math.min((earned / total) * 100, 100);
  }, [earned, total]);

  const [displayedProgress, setDisplayedProgress] = useState(animated ? 0 : percentage);
  const [displayedPercentage, setDisplayedPercentage] = useState(animated ? 0 : percentage);

  useEffect(() => {
    if (!animated) {
      setDisplayedProgress(percentage);
      setDisplayedPercentage(percentage);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayedProgress(percentage);
      setDisplayedPercentage(percentage);
      return;
    }

    const timer = window.setTimeout(() => {
      setDisplayedProgress(percentage);
    }, 80);
    const durationMs = 1900;
    const startTime = window.performance.now();

    const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = Math.min((now - startTime) / durationMs, 1);
      const eased = easeOutCubic(elapsed);
      setDisplayedPercentage(percentage * eased);

      if (elapsed < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frameId);
    };
  }, [animated, percentage]);

  return (
    <div className="relative">
      <div
        aria-label={label}
        aria-valuemax={total}
        aria-valuemin={0}
        aria-valuenow={earned}
        className="warrior-progress-track"
        role="progressbar"
      >
        {showPercentage ? (
          <div className="warrior-progress-percentage">
            {displayedPercentage.toFixed(1)}%
          </div>
        ) : null}
        <div className="warrior-progress-fill-shell" style={{ width: `${displayedProgress}%` }}>
          <div className="warrior-progress-fill" />
          {showFlame ? (
            <>
              <div className="warrior-progress-heat" />
              <div className="warrior-progress-flare" />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
