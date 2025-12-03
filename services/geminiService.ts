import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EnglishLevel, VocabularyCard, StorySegment, SimonCommand } from '../types';
import { decodeAudioData } from './audioUtils';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// -- Global Sound State --
let isMuted = false;
let globalVolume = 1.0; // 0.0 to 1.0
let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let currentSource: AudioBufferSourceNode | null = null;

const initAudioContext = () => {
  if (!audioCtx) {
    const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextConstructor({ sampleRate: 24000 });
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = isMuted ? 0 : globalVolume;
  }
  return audioCtx;
};

// Stop all currently playing audio
export const stopAllAudio = () => {
  // 1. Cancel Browser TTS (Just in case, though we don't use it anymore)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // 2. Stop Web Audio API (Gemini Voice)
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.disconnect();
    } catch (e) {
      // Ignore error if already stopped
    }
    currentSource = null;
  }
};

export const setGlobalMute = (mute: boolean) => {
  isMuted = mute;
  stopAllAudio(); // Stop sound immediately when muting
  if (gainNode) {
    gainNode.gain.value = isMuted ? 0 : globalVolume;
  }
  if (audioCtx && isMuted) {
    audioCtx.suspend();
  } else if (audioCtx && !isMuted) {
    audioCtx.resume();
  }
};

export const setGlobalVolume = (volume: number) => {
  globalVolume = volume;
  if (gainNode && !isMuted) {
    gainNode.gain.value = volume;
  }
};

export const getGlobalMute = () => isMuted;

// -- Helpers --

// STRICT CLEANER: Whitelists ONLY Chinese characters, numbers, and Chinese punctuation.
const cleanChineseText = (text: string): string => {
  if (!text) return "";
  // Regex: Hanzi + Numbers + Chinese Punctuation
  const chineseOnlyRegex = /[\u4e00-\u9fa50-9\uff0c\u3002\uff1f\uff01\u3001\u2026]+/g;
  const matches = text.match(chineseOnlyRegex);
  return matches ? matches.join('') : "";
};

// -- Text Generation Helpers --

export const generateAssessment = async (age: number): Promise<EnglishLevel> => {
  try {
    if (age <= 3) return EnglishLevel.BEGINNER;
    if (age <= 7) return EnglishLevel.INTERMEDIATE;
    return EnglishLevel.ADVANCED;
  } catch (e) {
    console.error("Assessment failed", e);
    return EnglishLevel.BEGINNER;
  }
};

export const generateVocabulary = async (level: EnglishLevel, topic: string, count: number = 5): Promise<VocabularyCard[]> => {
  try {
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          translation: { type: Type.STRING, description: "Chinese translation" },
          emoji: { type: Type.STRING, description: "A single emoji representing the word" },
          sentence: { type: Type.STRING, description: "Simple example sentence" }
        },
        required: ["word", "translation", "emoji", "sentence"]
      }
    };

    const prompt = `Generate ${count} vocabulary words about "${topic}" for a ${level} level English learner (Chinese child).`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    return JSON.parse(response.text || '[]') as VocabularyCard[];
  } catch (e) {
    console.error("Vocab generation failed", e);
    return [];
  }
};

export const generateStory = async (level: EnglishLevel, theme: string, length: number = 4): Promise<StorySegment[]> => {
  try {
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "One sentence of the story in English" },
          translation: { type: Type.STRING, description: "Chinese translation of the sentence" },
        },
        required: ["text", "translation"]
      }
    };

    const prompt = `Write a short, cute story (${length} sentences long) for a ${level} English learner. The story should be about a Panda in a ${theme} setting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    return JSON.parse(response.text || '[]') as StorySegment[];
  } catch (e) {
    console.error("Story generation failed", e);
    return [];
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A cute, cartoon illustration for children, vector art style, bright colors: ${prompt}` },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
};

export const generateSimonCommands = async (level: EnglishLevel, count: number = 5): Promise<SimonCommand[]> => {
  try {
     const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, description: "The full command sentence, e.g., 'Simon says touch your nose'" },
          translation: { type: Type.STRING, description: "Simple Chinese translation. HANZI ONLY. NO Pinyin." },
          bodyPart: { type: Type.STRING, description: "The key noun involved, e.g., 'nose'" },
          isSimon: { type: Type.BOOLEAN, description: "True if it starts with Simon Says, False otherwise" }
        },
        required: ["action", "translation", "isSimon"]
      }
    };

    const prompt = `Generate ${count} simple "Simon Says" style commands for a ${level} child. Mix in some commands that do NOT start with "Simon says". Use simple body parts or actions. Provide CLEAN Chinese translations (Simplified Chinese Characters ONLY).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    return JSON.parse(response.text || '[]') as SimonCommand[];
  } catch (e) {
    console.error("Simon generation failed", e);
    return [];
  }
};

export const createRolePlayChat = (level: EnglishLevel, scenario: string) => {
  const systemInstruction = `You are a friendly character in a "${scenario}" pretend play game for a child learning English (Level: ${level}). 
  
  Your Goal:
  1. Play your role (e.g., Shopkeeper, Doctor, Zookeeper).
  2. Encourage the child to speak.
  3. Use Emojis often.
  
  Correction Strategy (The Sandwich Method):
  If the child makes a grammar mistake, DO NOT say "That is wrong".
  Instead: Acknowledge -> Recast correctly -> Continue.
  
  Keep your responses short (1-2 sentences).`;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
  });
};

export const translateText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following English text to Simplified Chinese.
      
      STRICT OUTPUT RULES:
      1. Output ONLY Simplified Chinese characters (Hanzi).
      2. ABSOLUTELY NO Pinyin.
      3. ABSOLUTELY NO English letters.
      4. NO markdown, NO labels.
      
      Text: "${text}"`,
    });
    
    // Extra safety cleaning on the result
    return cleanChineseText(response.text?.trim() || "");
  } catch (e) {
    console.error("Translation failed", e);
    return "翻译失败";
  }
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav', 
              data: base64Audio
            }
          },
          { text: "Transcribe exactly what is said in English. Ignore background noise. If nothing is clear, return empty string." }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.error("Transcription failed", e);
    return "";
  }
};

// -- Shared AI Audio Player --
// Uses Gemini TTS for HIGH QUALITY voices (both English and Chinese)
const playAIVoice = async (text: string, voiceName: string = 'Kore') => {
  stopAllAudio(); // 1. Always stop previous audio
  
  if (isMuted || !text) return;

  const ctx = initAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // Using 'Kore' for everything ensures consistency. 
            // Gemini is multilingual and will pronounce Chinese characters if the text is Chinese.
            prebuiltVoiceConfig: { voiceName }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(base64Audio, ctx);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      if (gainNode) source.connect(gainNode);
      else source.connect(ctx.destination);
      
      currentSource = source;
      source.onended = () => {
        if (currentSource === source) currentSource = null;
      };
      
      source.start();
    }
  } catch (e) {
    console.error("TTS failed", e);
  }
};

// -- Exposed Audio Functions --

export const speakText = async (text: string) => {
  await playAIVoice(text, 'Kore');
};

export const speakChinese = async (text: string) => {
  // 1. Clean the text (remove Pinyin, English, etc)
  const cleaned = cleanChineseText(text);
  if (!cleaned) return;
  
  // 2. Use Gemini AI Voice (reusing Kore, it handles Chinese well enough for this context)
  // This AVOIDS the browser "Chinese Letter" issue entirely.
  await playAIVoice(cleaned, 'Kore');
};