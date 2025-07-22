import React from 'react';
import type { MusicComposition, Track } from './types';
import { Tab } from './types';
import { generateJam, cloneVoice, generateAiCover } from './services/geminiService';
import { TRACK_COLORS, PRESET_VOICES, VOICE_CLONE_MODELS, HeadphonesIcon, WaveformIcon, ZapIcon, Music2Icon, Settings2Icon, MicrophoneIcon, UploadCloudIcon } from './constants';
import { Button } from './components/Button';
import { Card, CardContent } from './components/Card';
import { Input } from './components/Input';
import { Slider } from './components/Slider';
import { Switch } from './components/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { Select } from './components/Select';

const TrackCard = ({ track, color }: { track: Track; color: string }) => (
  <Card className={`bg-gradient-to-br ${color} border-zinc-800 shadow-lg rounded-2xl p-0 fade-in`}>
    <CardContent className="p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <WaveformIcon className="text-white/80 w-6 h-6" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{track.name}</h3>
          <p className="text-sm text-white/70 italic">{track.instrument}</p>
        </div>
      </div>
      <p className="text-white/90 text-sm">{track.description}</p>
      <div className="flex gap-2 mt-2">
        <Button size="sm" className="bg-zinc-900/70 text-zinc-300 rounded-xl flex-1 backdrop-blur-sm">Solo</Button>
        <Button size="sm" className="bg-fuchsia-800/80 text-white rounded-xl flex-1 backdrop-blur-sm">Mute</Button>
      </div>
    </CardContent>
  </Card>
);

const FileInputTrigger = ({ onFileSelect, accept, children, disabled }: { onFileSelect: (file: File) => void; accept: string; children: React.ReactNode; disabled?: boolean; }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };
    return (
        <>
            <input type="file" ref={inputRef} onChange={handleFileChange} accept={accept} className="hidden" disabled={disabled} />
            <div onClick={() => !disabled && inputRef.current?.click()} className={disabled ? 'cursor-not-allowed' : ''}>{children}</div>
        </>
    );
};


export default function App() {
  // Common State
  const [activeTab, setActiveTab] = React.useState<Tab>(Tab.Jam);
  const [isLive, setIsLive] = React.useState(false);

  // Jam Tab State
  const [bpm, setBpm] = React.useState(120);
  const [autoGen, setAutoGen] = React.useState(true);
  const [prompt, setPrompt] = React.useState("A viral trap beat with an alien bassline and ethereal pads");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [generatedMusic, setGeneratedMusic] = React.useState<MusicComposition | null>(null);
  
  // AI Cover Tab State
  const [coverSong, setCoverSong] = React.useState<File | null>(null);
  const [voiceSource, setVoiceSource] = React.useState<'preset' | 'clone'>('preset');
  const [selectedPresetVoice, setSelectedPresetVoice] = React.useState<string>(PRESET_VOICES[0].id);
  const [clonedVoice, setClonedVoice] = React.useState<{ id: string; name: string } | null>(null);
  const [isCloning, setIsCloning] = React.useState(false);
  const [cloneModel, setCloneModel] = React.useState<string>(VOICE_CLONE_MODELS[0].id);
  
  const [isRecording, setIsRecording] = React.useState(false);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = React.useRef<number | null>(null);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const MAX_RECORDING_TIME = 30;

  const [isGeneratingCover, setIsGeneratingCover] = React.useState(false);
  const [generatedCoverUrl, setGeneratedCoverUrl] = React.useState<string | null>(null);
  const [coverError, setCoverError] = React.useState<string | null>(null);


  const handleGenerateClick = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateJam(prompt);
      setGeneratedMusic(result);
      setBpm(result.bpm);
      setActiveTab(Tab.Tracks);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  const handleStartRecording = async () => {
    if (isRecording) return;
    setCoverError(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        const audioChunks: Blob[] = [];
        
        recorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });

        recorder.addEventListener("stop", async () => {
            setIsRecording(false);
            if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            setRecordingTime(0);
            stream.getTracks().forEach(track => track.stop());

            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            setIsCloning(true);
            setClonedVoice(null);
            try {
                const result = await cloneVoice(audioBlob, `rec-${Date.now()}.wav`, cloneModel);
                setClonedVoice(result);
            } catch (e) {
                setCoverError("Failed to clone voice.");
            } finally {
                setIsCloning(false);
            }
        });

        recorder.start();
        setIsRecording(true);
        setRecordingTime(0);
        recordingIntervalRef.current = window.setInterval(() => {
            setRecordingTime(t => {
                const newTime = t + 1;
                if (newTime >= MAX_RECORDING_TIME) {
                    handleStopRecording();
                }
                return newTime;
            });
        }, 1000);

    } catch (err) {
        setCoverError("Microphone access was denied. Please enable it in your browser settings.");
        console.error("Mic permission error:", err);
    }
  };

  const handleStopRecording = () => {
      if (recorderRef.current && isRecording) {
          recorderRef.current.stop();
      }
  };

  const handleVoiceFileClone = async (file: File) => {
    setCoverError(null);
    setIsCloning(true);
    setClonedVoice(null);
    try {
        const result = await cloneVoice(file, file.name, cloneModel);
        setClonedVoice(result);
    } catch (e) {
        setCoverError("Failed to clone voice from file.");
    } finally {
        setIsCloning(false);
    }
  };

  const handleGenerateCoverClick = async () => {
    if (!coverSong || (!selectedPresetVoice && !clonedVoice)) return;

    setIsGeneratingCover(true);
    setGeneratedCoverUrl(null);
    setCoverError(null);
    
    const voiceId = voiceSource === 'clone' ? clonedVoice!.id : selectedPresetVoice;

    try {
        const result = await generateAiCover(coverSong, voiceId);
        setGeneratedCoverUrl(result.audioUrl);
    } catch(e) {
        setCoverError("Failed to generate AI Cover. Please try again.");
    } finally {
        setIsGeneratingCover(false);
    }
  };

  const tracksWithColors: (Track & { color: string })[] =
    generatedMusic?.tracks.map((track, idx) => ({
      ...track,
      color: TRACK_COLORS[idx % TRACK_COLORS.length],
    })) || [];

  const canGenerateCover = coverSong && (voiceSource === 'preset' ? selectedPresetVoice : clonedVoice);

  return (
    <div className="bg-gradient-to-br from-black via-zinc-900 to-gray-950 min-h-screen w-full flex flex-col items-center py-8 px-4 font-sans text-white">
      <div className="w-full max-w-5xl">
        <div className="w-full flex items-center justify-between px-6 py-4 rounded-2xl shadow-2xl bg-gradient-to-r from-zinc-900/90 to-zinc-800/80 border border-zinc-700 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <WaveformIcon className="w-8 h-8 text-fuchsia-400 animate-pulse" />
            <span className="text-2xl font-bold tracking-wide">
              BANDO-FI<span className="text-fuchsia-500">AI</span>
            </span>
            <span className="ml-4 px-2 py-1 rounded-xl bg-black/30 text-xs text-fuchsia-300 font-mono tracking-widest hidden sm:block">
              GEN-2 MODE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="rounded-xl border border-fuchsia-600 bg-fuchsia-950 text-fuchsia-200 hover:bg-fuchsia-900/60"
              onClick={() => setIsLive((v) => !v)}
            >
              <ZapIcon className="mr-1 h-4 w-4" /> {isLive ? "Stop" : "Go Live"}
            </Button>
            <Button variant="ghost" className="rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700/60">
              <Settings2Icon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as Tab)}>
          <TabsList>
            <TabsTrigger value={Tab.Jam}><Music2Icon className="w-5 h-5 mr-2" /> Jam</TabsTrigger>
            <TabsTrigger value={Tab.Tracks}><HeadphonesIcon className="w-5 h-5 mr-2" /> Tracks</TabsTrigger>
            <TabsTrigger value={Tab.FX}><WaveformIcon className="w-5 h-5 mr-2" /> FX</TabsTrigger>
            <TabsTrigger value={Tab.Cover}><MicrophoneIcon className="w-5 h-5 mr-2" /> AI Cover</TabsTrigger>
          </TabsList>

          <TabsContent value={Tab.Jam}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border-zinc-700 shadow-lg rounded-2xl p-0">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fuchsia-400">AI Prompt</span>
                    <Switch checked={autoGen} onCheckedChange={setAutoGen} />
                    <span className="text-xs text-zinc-400">Auto-Refine</span>
                  </div>
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the music you want to create..."
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleGenerateClick}
                    disabled={isLoading || !prompt}
                    className="bg-fuchsia-700 hover:bg-fuchsia-600 disabled:bg-fuchsia-900/50 disabled:cursor-not-allowed rounded-xl text-lg font-bold shadow-fuchsia-800/30 transition-all duration-300"
                  >
                    {isLoading ? 'Generating...' : 'Generate Jam'}
                  </Button>
                   {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-900/90 to-zinc-900/80 border-zinc-800 shadow-lg rounded-2xl p-0">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">Tempo (BPM)</span>
                    <span className="text-white font-mono text-xl">{bpm}</span>
                  </div>
                  <Slider
                    min={60} max={200} step={1}
                    value={bpm}
                    onValueChange={(val) => setBpm(val)}
                  />
                  <div className="grid grid-cols-2 gap-2 text-center text-cyan-400 text-sm">
                      <div>Genre: <span className="text-white font-semibold">{generatedMusic?.genre || 'N/A'}</span></div>
                      <div>Mood: <span className="text-white font-semibold">{generatedMusic?.mood || 'N/A'}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value={Tab.Tracks}>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {tracksWithColors.length > 0 ? (
                tracksWithColors.map((track) => <TrackCard key={track.name} track={track} color={track.color} />)
              ) : (
                <Card className="md:col-span-2 bg-zinc-900/50 border-zinc-800 border-dashed rounded-2xl">
                    <CardContent className="p-10 text-center text-zinc-400">
                        <p>Your generated tracks will appear here.</p>
                        <p>Go to the 'Jam' tab to create something new!</p>
                    </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value={Tab.FX}>
             <div className="grid grid-cols-1 gap-6 mt-4">
                <Card className="bg-gradient-to-br from-fuchsia-950/90 to-fuchsia-900/60 border-fuchsia-800 shadow-2xl rounded-2xl p-0">
                    <CardContent className="p-6 flex flex-col gap-4">
                        <span className="font-bold text-fuchsia-200 text-xl">Global FX</span>
                        <div className="flex flex-col gap-y-5">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-white w-24">Reverb</span>
                                <Slider min={0} max={100} value={60} />
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-white w-24">Delay</span>
                                <Slider min={0} max={100} value={35} />
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-white w-24">AI Glitch</span>
                                <Slider min={0} max={100} value={85} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value={Tab.Cover}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border-zinc-700">
                        <CardContent>
                            <h3 className="font-bold text-lg text-fuchsia-400 mb-3">1. Upload Song to Cover</h3>
                            <FileInputTrigger onFileSelect={setCoverSong} accept="audio/mp3,audio/wav" disabled={isGeneratingCover}>
                                <div className="w-full h-24 border-2 border-dashed border-zinc-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-fuchsia-500 hover:bg-zinc-800/50 transition-colors">
                                    <UploadCloudIcon className="w-8 h-8 text-zinc-400 mb-1" />
                                    {coverSong ? 
                                        <p className="text-white font-semibold">{coverSong.name}</p> :
                                        <p className="text-zinc-400">Click or drop MP3/WAV here</p>
                                    }
                                </div>
                            </FileInputTrigger>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border-zinc-700">
                        <CardContent>
                            <h3 className="font-bold text-lg text-fuchsia-400 mb-3">2. Select Vocal Identity</h3>
                            <div className="flex bg-zinc-800 p-1 rounded-lg mb-4">
                                <button onClick={() => setVoiceSource('preset')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-all ${voiceSource === 'preset' ? 'bg-fuchsia-700 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}>Preset Voices</button>
                                <button onClick={() => setVoiceSource('clone')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-all ${voiceSource === 'clone' ? 'bg-fuchsia-700 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}>Clone New Voice</button>
                            </div>

                            {voiceSource === 'preset' && (
                                <div className="grid grid-cols-2 gap-3">
                                    {PRESET_VOICES.map(voice => (
                                        <button key={voice.id} onClick={() => setSelectedPresetVoice(voice.id)} className={`p-3 text-left rounded-lg transition-all border-2 ${selectedPresetVoice === voice.id ? 'bg-fuchsia-600/30 border-fuchsia-500' : 'bg-zinc-800 border-transparent hover:border-fuchsia-600'}`}>
                                            <p className="font-semibold text-white">{voice.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {voiceSource === 'clone' && (
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <h4 className="font-semibold text-cyan-300 mb-2">A. Select Cloning Engine</h4>
                                        <Select value={cloneModel} onChange={e => setCloneModel(e.target.value)} disabled={isCloning}>
                                            {VOICE_CLONE_MODELS.map(model => (
                                                <option key={model.id} value={model.id}>{model.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <h4 className="font-semibold text-cyan-300">B. Provide Voice Sample</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2 justify-center">
                                            <Button onClick={isRecording ? handleStopRecording : handleStartRecording} disabled={isCloning} className={`w-full ${isRecording ? 'bg-red-600 hover:bg-red-500' : 'border-cyan-700 text-cyan-200'}`} variant={isRecording ? 'default' : 'outline'}>
                                                <MicrophoneIcon className="w-4 h-4 mr-2" />
                                                {isRecording ? 'Stop Recording' : 'Record 30s'}
                                            </Button>
                                            {isRecording && (
                                                <div className="w-full bg-zinc-700 rounded-full h-2.5 mt-1">
                                                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(recordingTime / MAX_RECORDING_TIME) * 100}%` }}></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 justify-center">
                                            <FileInputTrigger onFileSelect={handleVoiceFileClone} accept="audio/mp3,audio/wav" disabled={isCloning}>
                                                <Button disabled={isCloning} className="w-full border-cyan-700 text-cyan-200" variant="outline" as="div">
                                                    <UploadCloudIcon className="w-4 h-4 mr-2" /> Upload File
                                                </Button>
                                            </FileInputTrigger>
                                        </div>
                                    </div>
                                    {(isCloning || clonedVoice) && <div className="text-center text-sm p-3 bg-zinc-800 rounded-lg">
                                        {isCloning && <p className="text-cyan-300 animate-pulse">Cloning voice using {VOICE_CLONE_MODELS.find(m => m.id === cloneModel)?.name}, please wait...</p>}
                                        {clonedVoice && !isCloning && <p className="text-green-400">Voice Ready: <span className="font-bold">{clonedVoice.name}</span></p>}
                                    </div>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="bg-gradient-to-br from-gray-900/90 to-zinc-900/80 border-zinc-800 sticky top-8">
                        <CardContent>
                            <h3 className="font-bold text-lg text-fuchsia-400 mb-4">3. Generate & Export</h3>
                            <Button onClick={handleGenerateCoverClick} disabled={!canGenerateCover || isGeneratingCover} className="w-full text-lg bg-fuchsia-700 hover:bg-fuchsia-600 disabled:bg-fuchsia-900/50 disabled:cursor-not-allowed">
                                {isGeneratingCover ? 'Generating Cover...' : 'Generate AI Cover'}
                            </Button>
                            {coverError && <p className="text-red-400 text-sm mt-2">{coverError}</p>}
                            
                            {generatedCoverUrl && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-cyan-300 mb-2">Result</h4>
                                    <audio controls src={generatedCoverUrl} className="w-full"></audio>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <Button variant="outline" className="border-cyan-700 text-cyan-200">Download MP3</Button>
                                        <Button variant="outline" className="border-zinc-600 text-zinc-300">Export Stems</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-900/80 rounded-2xl shadow-lg border border-fuchsia-900 flex items-center gap-3 z-50 backdrop-blur-sm">
        <span className="text-xs font-mono text-fuchsia-300 tracking-wide">
          Engine Status: <span className="font-bold text-fuchsia-400">READY</span>
        </span>
        <span className="text-zinc-400 text-xs ml-4 hidden sm:block">
          &copy; 2024 BANDO-FI AI
        </span>
      </div>
    </div>
  );
}