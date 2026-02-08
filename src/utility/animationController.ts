export const FRAMES = ["▰▱▱▱▱▱▱", "▰▰▱▱▱▱▱", "▰▰▰▱▱▱▱", "▰▰▰▰▱▱▱", "▰▰▰▰▰▱▱", "▰▰▰▰▰▰▱", "▰▰▰▰▰▰▰"];

interface OnFrameCallback {
  (frame: string): Promise<void>;
}

export class AnimationController {
  private interval: NodeJS.Timeout | null = null;

  /**
   * Avvia un'animazione ciclica chiamando la callback fornita con il frame corrente.
   * Se un'animazione è già in corso su questa istanza, viene fermata prima di avviarne una nuova.
   *
   * @param onFrameCallback Funzione asincrona chiamata ad ogni frame. Riceve il frame corrente come stringa.
   * @param frames Array di stringhe che rappresentano i frame dell'animazione. Default: FRAMES predefiniti.
   * @param intervalMs Intervallo in millisecondi tra i frame. Default: 800ms.
   */
  start(onFrameCallback: OnFrameCallback, frames: string[] = FRAMES, intervalMs: number = 800): void {
    this.stop(); // Assicura che non ci siano animazioni precedenti in corso su questa istanza
    let frameIndex = 0;
    this.interval = setInterval(async () => {
      frameIndex = (frameIndex + 1) % frames.length;
      const frame = frames[frameIndex];
      try {
        await onFrameCallback(frame);
      } catch (e) {
        // Ignora errori (es. rate limit o errori di rete temporanei)
      }
    }, intervalMs);
  }

  /**
   * Ferma l'animazione corrente se attiva.
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
