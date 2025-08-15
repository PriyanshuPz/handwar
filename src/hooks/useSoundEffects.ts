import { useCallback, useRef } from "react";

export const useSoundEffects = () => {
  const audioContext = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  }, []);

  const playBeep = useCallback(
    (frequency: number, duration: number = 200, volume: number = 0.3) => {
      const ctx = initAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + duration / 1000
      );

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    },
    [initAudioContext]
  );

  const playCountdownBeep = useCallback(() => {
    playBeep(800, 150, 0.2);
  }, [playBeep]);

  const playGoSound = useCallback(() => {
    playBeep(1200, 300, 0.3);
  }, [playBeep]);

  const playTapSound = useCallback(() => {
    playBeep(600, 100, 0.2);
  }, [playBeep]);

  const playWinSound = useCallback(() => {
    // Play a sequence of ascending notes for win
    setTimeout(() => playBeep(523, 150, 0.2), 0); // C5
    setTimeout(() => playBeep(659, 150, 0.2), 150); // E5
    setTimeout(() => playBeep(784, 300, 0.2), 300); // G5
  }, [playBeep]);

  const playLoseSound = useCallback(() => {
    // Play a sequence of descending notes for lose
    setTimeout(() => playBeep(392, 150, 0.2), 0); // G4
    setTimeout(() => playBeep(330, 150, 0.2), 150); // E4
    setTimeout(() => playBeep(262, 300, 0.2), 300); // C4
  }, [playBeep]);

  const playDrawSound = useCallback(() => {
    playBeep(440, 300, 0.2); // A4
  }, [playBeep]);

  const playSelectionSound = useCallback(() => {
    playBeep(750, 80, 0.15);
  }, [playBeep]);

  const playTimeoutWarning = useCallback(() => {
    playBeep(1000, 100, 0.3);
  }, [playBeep]);

  return {
    playCountdownBeep,
    playGoSound,
    playTapSound,
    playWinSound,
    playLoseSound,
    playDrawSound,
    playSelectionSound,
    playTimeoutWarning,
  };
};
