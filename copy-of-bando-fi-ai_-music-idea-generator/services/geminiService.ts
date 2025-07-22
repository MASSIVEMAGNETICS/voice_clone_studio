import { GoogleGenAI, Type } from "@google/genai";
import type { MusicComposition } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    bpm: {
      type: Type.INTEGER,
      description: "The beats per minute of the song. Should be between 60 and 200.",
    },
    genre: {
      type: Type.STRING,
      description: "The primary genre of the music (e.g., Trap, Lo-fi, House).",
    },
    mood: {
      type: Type.STRING,
      description: "The overall mood or feeling of the music (e.g., Dark, Energetic, Chill).",
    },
    tracks: {
      type: Type.ARRAY,
      description: "A list of musical tracks or layers.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "A creative and descriptive name for the track (e.g., 'Alien Bass', 'Ghostly Pads').",
          },
          instrument: {
            type: Type.STRING,
            description: "The main instrument or sound type for this track (e.g., '808 Bass', 'Synth Lead', 'Drum Machine').",
          },
          description: {
            type: Type.STRING,
            description: "A brief description of what this track should sound like or the pattern it should play.",
          },
        },
        required: ["name", "instrument", "description"],
      },
    },
  },
  required: ["bpm", "genre", "mood", "tracks"],
};


export const generateJam = async (prompt: string): Promise<MusicComposition> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the following prompt, generate a concept for a musical jam. The response must adhere to the provided JSON schema. Prompt: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const generatedComposition = JSON.parse(jsonText);
    return generatedComposition as MusicComposition;

  } catch (error) {
    console.error("Error generating jam with Gemini:", error);
    throw new Error("Failed to generate music composition. The AI might be unavailable or the request was invalid.");
  }
};


// Mock function to simulate cloning a voice from an audio blob.
// In a real application, this would call a specialized voice cloning API.
export const cloneVoice = async (audio: Blob, fileName: string, model: string): Promise<{ id: string; name: string }> => {
  console.log(`Cloning voice using model: ${model} from ${fileName} (size: ${audio.size} bytes)...`);
  // Simulate network delay and processing
  await new Promise(resolve => setTimeout(resolve, 2500));
  const newName = `Cloned - ${fileName.split('.')[0].substring(0, 20)}`;
  const id = `voice_${Date.now()}`;
  console.log(`Voice cloned successfully: ID=${id}, Name=${newName}`);
  return { id, name: newName };
};

// Mock function to simulate generating an AI cover.
// In a real application, this would call a service capable of audio source separation and voice synthesis.
export const generateAiCover = async (songFile: File, voiceId: string): Promise<{ audioUrl: string }> => {
  console.log(`Generating cover for song "${songFile.name}" with voice ID "${voiceId}"...`);
  // Simulate a longer network delay and processing time for cover generation
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('Cover generation complete.');
  // In a real app, this would be a URL to a generated audio file.
  // This placeholder will result in a broken audio player, which is expected without a real backend.
  return { audioUrl: "/placeholder-audio.mp3" };
};