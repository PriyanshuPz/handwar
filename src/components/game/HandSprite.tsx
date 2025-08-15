import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// @ts-expect-error
import { SpriteAnimator } from "react-sprite-animator";
import type { AnimationState } from "../../hooks/useGameLogic";

interface HandSpriteProps {
  animation: AnimationState;
  isPlayer: boolean;
  className?: string;
}

interface SpriteConfig {
  sprite: string;
  width: number;
  height: number;
  fps: number;
  shouldAnimate: boolean;
  direction?: "horizontal" | "vertical";
  frameCount?: number;
  reset?: boolean;
  onEnd?: () => void;
}

const getSpriteConfig = (state: AnimationState): SpriteConfig => {
  switch (state) {
    case "rock":
      return {
        sprite: "/assets/sprites/idle_to_rock.png",
        width: 300,
        height: 400,
        fps: 24,
        shouldAnimate: true,
        direction: "horizontal",
        frameCount: 46,
        reset: true,
      };
    case "paper":
      return {
        sprite: "/assets/sprites/idle_to_paper.png",
        width: 300,
        height: 400,
        fps: 24,
        shouldAnimate: true,
        direction: "horizontal",
        frameCount: 32,
        reset: true,
      };
    case "scissors":
      return {
        sprite: "/assets/sprites/idle_to_scissor.png",
        width: 300,
        height: 400,
        fps: 24,
        shouldAnimate: true,
        direction: "horizontal",
        frameCount: 45,
        reset: true,
      };
    default: // idle
      return {
        sprite: "/assets/sprites/idle.png",
        width: 300,
        height: 400,
        fps: 12,
        shouldAnimate: true,
        direction: "horizontal",
        frameCount: 20,
        reset: false, // Don't reset idle animation, let it loop
      };
  }
};

export function HandSprite({
  animation,
  isPlayer,
  className = "",
}: HandSpriteProps) {
  const [animationKey, setAnimationKey] = useState(0);

  const spriteConfig = getSpriteConfig(animation);

  // Reset animation when animation state changes
  useEffect(() => {
    setAnimationKey((prev) => prev + 1); // Force re-render of SpriteAnimator
  }, [animation]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animation}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`w-[300px] h-[300px] flex items-center justify-center ${className}`}
      >
        <div className={`relative ${!isPlayer ? "scale-y-[-1]" : ""}`}>
          <SpriteAnimator
            key={`${animation}-${animationKey}`}
            sprite={spriteConfig.sprite}
            width={spriteConfig.width}
            height={spriteConfig.height}
            shouldAnimate={spriteConfig.shouldAnimate}
            fps={spriteConfig.fps}
            direction={spriteConfig.direction}
            frameCount={spriteConfig.frameCount}
            reset={spriteConfig.reset}
            stopLastFrame={animation !== "idle"}
            style={{
              imageRendering: "pixelated",
              transform: "scale(1)",
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
