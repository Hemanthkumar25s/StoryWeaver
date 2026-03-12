import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Volume2, Loader2, Play, Square } from 'lucide-react';
import { generateStoryFromImage, generateSpeech } from './services/gemini';
import { Chatbot } from './components/Chatbot';
import { cn } from './utils';
import Markdown from 'react-markdown';

export default function App() {
  const [image, setImage] = useState<{ url: string; base64: string; mimeType: string } | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setImage({
        url: URL.createObjectURL(file),
        base64: base64Data,
        mimeType: file.type,
      });
      setStory(null);
      setAudioUrl(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateStory = async () => {
    if (!image) return;
    setIsGeneratingStory(true);
    setStory(null);
    setAudioUrl(null);
    try {
      const generatedStory = await generateStoryFromImage(image.base64, image.mimeType);
      setStory(generatedStory);
    } catch (error) {
      console.error("Error generating story:", error);
      alert("Failed to generate story. Please try again.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleReadAloud = async () => {
    if (!story) return;
    
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const base64Audio = await generateSpeech(story);
      if (base64Audio) {
        const url = `data:audio/mp3;base64,${base64Audio}`;
        setAudioUrl(url);
        if (!audioRef.current) {
          audioRef.current = new Audio(url);
          audioRef.current.onended = () => setIsPlaying(false);
        } else {
          audioRef.current.src = url;
        }
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      alert("Failed to generate speech. Please try again.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
      <header className="mb-12 text-center md:text-left">
        <h1 className="font-serif text-5xl md:text-6xl font-light tracking-tight text-[#2c2c2a] mb-4">
          StoryWeaver
        </h1>
        <p className="text-[#5A5A40] text-lg max-w-2xl">
          Upload an image and let the AI weave a compelling opening paragraph to a story set in that world.
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Image Upload */}
        <div className="space-y-6">
          <div className="card p-8 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-[#d1d1c7] relative overflow-hidden group">
            {image ? (
              <>
                <img src={image.url} alt="Uploaded scene" className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <label className="olive-button cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Change Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-[#8c8c8a] hover:text-[#5A5A40] transition-colors">
                <div className="w-20 h-20 rounded-full bg-[#f5f5f0] flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <span className="font-medium text-lg mb-2">Upload a scene</span>
                <span className="text-sm">Drag and drop or click to browse</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleGenerateStory}
              disabled={!image || isGeneratingStory}
              className="olive-button w-full md:w-auto flex items-center justify-center gap-2 text-lg px-8 py-4"
            >
              {isGeneratingStory ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Weaving Story...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Story
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Story Display */}
        <div className="card p-8 md:p-12 min-h-[500px] flex flex-col relative">
          {!story && !isGeneratingStory ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#8c8c8a] text-center">
              <Sparkles className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-serif text-xl italic">Your story will appear here...</p>
            </div>
          ) : isGeneratingStory ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#5A5A40] space-y-4">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="font-serif text-lg animate-pulse">Analyzing mood and setting...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleReadAloud}
                  disabled={isGeneratingAudio}
                  className="flex items-center gap-2 text-[#5A5A40] hover:text-[#2c2c2a] transition-colors font-medium bg-[#f5f5f0] px-4 py-2 rounded-full"
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Square className="w-4 h-4 fill-current" />
                  ) : audioUrl ? (
                    <Play className="w-4 h-4 fill-current" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  {isGeneratingAudio ? 'Preparing Audio...' : isPlaying ? 'Stop' : 'Read Aloud'}
                </button>
              </div>
              <div className="story-text flex-1">
                <Markdown>{story}</Markdown>
              </div>
            </div>
          )}
        </div>
      </main>

      <Chatbot />
    </div>
  );
}
