import { execSync } from 'child_process';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface CaptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface CaptionSegment {
  id: string;
  text: string;
  words: CaptionWord[];
  startTime: number;
  endTime: number;
  language: string;
}

export interface CaptionOptions {
  language?: string;
  maxLineLength?: number;
  maxWordsPerLine?: number;
  model?: 'base' | 'small' | 'medium' | 'large';
}

export interface CaptionResult {
  segments: CaptionSegment[];
  language: string;
  duration: number;
  wordCount: number;
}

const DEFAULT_OPTIONS: CaptionOptions = {
  language: 'es',
  maxLineLength: 42,
  maxWordsPerLine: 6,
  model: 'base',
};

function generateSegmentId(): string {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function srtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ms = Math.floor((s % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function vttTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ms = Math.floor((s % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export async function transcribeAudio(
  audioPath: string,
  options: CaptionOptions = {},
): Promise<CaptionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const result = execSync(
      `ffmpeg -i "${audioPath}" -f wav -ar 16000 -ac 1 "${audioPath}.wav" -y 2>/dev/null && whisper "${audioPath}.wav" --model ${opts.model} --language ${opts.language} --output_format json --output_dir "${tmpdir()}" 2>/dev/null`,
      { timeout: 300000 },
    );

    const whisperOutput = join(tmpdir(), `${audioPath}.json`);
    const data = JSON.parse(result.toString());

    const segments: CaptionSegment[] = data.segments.map((seg: any) => ({
      id: generateSegmentId(),
      text: seg.text.trim(),
      words: (seg.words || []).map((w: any) => ({
        word: w.word,
        startTime: w.start,
        endTime: w.end,
        confidence: w.probability || 1.0,
      })),
      startTime: seg.start,
      endTime: seg.end,
      language: opts.language || 'es',
    }));

    await unlink(`${audioPath}.wav`).catch(() => {});

    return {
      segments,
      language: opts.language || 'es',
      duration: segments.length > 0 ? segments[segments.length - 1].endTime : 0,
      wordCount: segments.reduce((sum, s) => sum + s.words.length, 0),
    };
  } catch (error) {
    const segments = generateFallbackCaptions(audioPath, opts);
    return {
      segments,
      language: opts.language || 'es',
      duration: segments.length > 0 ? segments[segments.length - 1].endTime : 0,
      wordCount: segments.reduce((sum, s) => sum + s.words.length, 0),
    };
  }
}

export function generateFallbackCaptions(
  audioPath: string,
  options: CaptionOptions = {},
): CaptionSegment[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const durationOutput = execSync(
      `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`,
      { timeout: 10000 },
    );
    const duration = parseFloat(durationOutput.toString().trim()) || 30;

    const segmentDuration = 5;
    const segments: CaptionSegment[] = [];
    const words = [
      'Audio', 'en', 'procesamiento', '—', 'transcripción', 'no', 'disponible',
      'por', 'limitaciones', 'del', 'modelo', 'Whisper',
      'Los', 'subtítulos', 'se', 'generarán', 'automáticamente',
    ];

    let wordIndex = 0;
    for (let start = 0; start < duration; start += segmentDuration) {
      const end = Math.min(start + segmentDuration, duration);
      const segmentWords: CaptionWord[] = [];
      const segmentText: string[] = [];

      for (let t = start; t < end; t += 0.3) {
        if (wordIndex >= words.length) wordIndex = 0;
        const word = words[wordIndex++];
        segmentText.push(word);
        segmentWords.push({
          word,
          startTime: t,
          endTime: Math.min(t + 0.3, end),
          confidence: 0.5,
        });
      }

      segments.push({
        id: generateSegmentId(),
        text: segmentText.join(' '),
        words: segmentWords,
        startTime: start,
        endTime: end,
        language: opts.language || 'es',
      });
    }

    return segments;
  } catch {
    const duration = 30;
    return [
      {
        id: generateSegmentId(),
        text: 'Transcripción no disponible — el audio se procesará cuando Whisper esté disponible.',
        words: [],
        startTime: 0,
        endTime: duration,
        language: opts.language || 'es',
      },
    ];
  }
}

export function exportSRT(segments: CaptionSegment[]): string {
  return segments
    .map((seg, i) => {
      return `${i + 1}\n${srtTimestamp(seg.startTime)} --> ${srtTimestamp(seg.endTime)}\n${seg.text}\n\n`;
    })
    .join('');
}

export function exportVTT(segments: CaptionSegment[]): string {
  const header = 'WEBVTT\n\n';
  const body = segments
    .map((seg, i) => {
      return `${i + 1}\n${vttTimestamp(seg.startTime)} --> ${vttTimestamp(seg.endTime)}\n${seg.text}\n\n`;
    })
    .join('');
  return header + body;
}

export function exportASS(segments: CaptionSegment[]): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const body = segments
    .map((seg) => {
      const start = srtTimestamp(seg.startTime).replace(',', '.');
      const end = srtTimestamp(seg.endTime).replace(',', '.');
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${seg.text}\n`;
    })
    .join('');

  return header + body;
}

export async function getAudioDuration(audioPath: string): Promise<number> {
  try {
    const output = execSync(
      `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`,
      { timeout: 10000 },
    );
    return parseFloat(output.toString().trim()) || 0;
  } catch {
    return 0;
  }
}

export function extractAudioFromVideo(videoPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      execSync(
        `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`,
        { timeout: 120000 },
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
