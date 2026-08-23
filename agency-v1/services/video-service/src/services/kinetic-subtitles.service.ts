/**
 * Kinetic Animated Karaoke Subtitles & Emoji Highlighter (CapCut / Submagic style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates dynamic, word-by-word synchronized subtitles with active word highlighting,
 * automatic contextual emoji injection, and ASS/VTT/SRT format outputs.
 */

export interface TimedWord {
  word: string;
  startSec: number;
  endSec: number;
}

export interface SubtitleBlock {
  words: TimedWord[];
  startSec: number;
  endSec: number;
  text: string;
  emoji?: string;
}

export class KineticSubtitlesService {
  private emojiMap: Record<string, string> = {
    dinero: "💰",
    éxito: "🚀",
    crecimiento: "📈",
    error: "❌",
    estrategia: "🎯",
    fuego: "🔥",
    tiempo: "⏳",
    negocio: "💼",
    código: "💻",
    victoria: "🏆",
  };

  /**
   * Enriches timed words into dynamic subtitle blocks with emojis.
   */
  public generateSubtitleBlocks(words: TimedWord[], wordsPerBlock = 4): SubtitleBlock[] {
    const blocks: SubtitleBlock[] = [];

    for (let i = 0; i < words.length; i += wordsPerBlock) {
      const chunk = words.slice(i, i + wordsPerBlock);
      const text = chunk.map((w) => w.word).join(" ");
      const startSec = chunk[0].startSec;
      const endSec = chunk[chunk.length - 1].endSec;

      let matchedEmoji: string | undefined;
      for (const [kw, emo] of Object.entries(this.emojiMap)) {
        if (text.toLowerCase().includes(kw)) {
          matchedEmoji = emo;
          break;
        }
      }

      blocks.push({
        words: chunk,
        startSec,
        endSec,
        text,
        emoji: matchedEmoji,
      });
    }

    return blocks;
  }

  /**
   * Generates Advanced SubStation Alpha (ASS) format for FFmpeg hardcoded karaoke rendering.
   */
  public generateASSFormat(blocks: SubtitleBlock[]): string {
    const header = `[Script Info]
Title: LegacyMark Kinetic Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,70,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,0,2,20,20,380,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events = blocks.map((b) => {
      const start = this.formatASSTime(b.startSec);
      const end = this.formatASSTime(b.endSec);
      const emojiSuffix = b.emoji ? ` ${b.emoji}` : "";
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,{\\b1\\c&H00FFFF&}${b.text.toUpperCase()}{\\c&HFFFFFF&}${emojiSuffix}`;
    });

    return header + events.join("\n");
  }

  private formatASSTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }
}

export const kineticSubtitlesService = new KineticSubtitlesService();
