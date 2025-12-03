import React, { useEffect, useState, useRef } from 'react';
import { EnglishLevel } from '../../types';
import { createRolePlayChat, speakText, transcribeAudio, translateText, speakChinese, stopAllAudio } from '../../services/geminiService';
import { blobToBase64 } from '../../services/audioUtils';
import { Chat, GenerateContentResponse } from "@google/genai";
import { Send, Store, Volume2, Mic, MicOff, Loader2, Languages } from 'lucide-react';

interface Props {
  level: EnglishLevel;
  onBack: () => void;
}

interface Message {
  id: number;
  role: 'user' | 'model';
  text: string;
  translation?: string; // Optional translation
  translating?: boolean; // Loading state for translation
}

const SCENARIOS = [
  { id: 'Supermarket', emoji: '🛒', name: 'Supermarket', prompt: 'I am a cashier at a supermarket.' },
  { id: 'Doctor', emoji: '👨‍⚕️', name: 'Doctor', prompt: 'I am a gentle doctor.' },
  { id: 'Restaurant', emoji: '🍔', name: 'Restaurant', prompt: 'I am a waiter at a yummy restaurant.' },
  { id: 'Zoo', emoji: '🦁', name: 'Zoo', prompt: 'I am a zookeeper showing you animals.' },
];

const RolePlayActivity: React.FC<Props> = ({ level, onBack }) => {
  const [scenario, setScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Audio UI State
  const [playingMsgId, setPlayingMsgId] = useState<number | null>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for voice handling
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Stop audio on unmount
  useEffect(() => {
    return () => stopAllAudio();
  }, []);

  useEffect(() => {
    if (scenario) {
        stopAllAudio();
        // Initialize Chat
        chatRef.current = createRolePlayChat(level, scenario.prompt);
        
        // Initial greeting
        const startChat = async () => {
            setLoading(true);
            try {
                const response: GenerateContentResponse = await chatRef.current!.sendMessage({ message: `Start the game as the ${scenario.name}. Say hello to the child simply.` });
                const text = response.text || `Hello! Welcome to the ${scenario.name}.`;
                setMessages([{ id: Date.now(), role: 'model', text }]);
                
                // Speak Greeting
                setPlayingMsgId(Date.now());
                await speakText(text);
                setPlayingMsgId(null);
                
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        startChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, scenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatRef.current) return;

    stopAllAudio(); // Stop any reading when sending new message
    const userMsg: Message = { id: Date.now(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: inputText });
      const text = response.text || "I see!";
      const aiId = Date.now() + 1;
      const aiMsg: Message = { id: aiId, role: 'model', text };
      setMessages(prev => [...prev, aiMsg]);
      
      // Speak Response
      setPlayingMsgId(aiId);
      await speakText(text);
      setPlayingMsgId(null);

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleTranslate = async (msgId: number, text: string) => {
    const msg = messages.find(m => m.id === msgId);
    
    // If it's currently translating, do nothing
    if (msg?.translating) return;

    // If already translated, play the audio
    if (msg?.translation) {
      setPlayingMsgId(msgId);
      await speakChinese(msg.translation); 
      setPlayingMsgId(null);
      return;
    }

    // Set translating state
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, translating: true } : m));
    
    const translated = await translateText(text);
    
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, translating: false, translation: translated } : m));
    
    // Speak immediately if valid
    if (translated) {
        setPlayingMsgId(msgId);
        await speakChinese(translated);
        setPlayingMsgId(null);
    }
  };

  const handleSpeakText = async (msgId: number, text: string) => {
     if (playingMsgId === msgId) return; // Prevent double click
     setPlayingMsgId(msgId);
     await speakText(text);
     setPlayingMsgId(null);
  };

  const startRecording = async () => {
    stopAllAudio();
    // 1. Try Native SpeechRecognition first (Lower Latency)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      console.log("Using Native SpeechRecognition");
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
         console.error("Speech Recognition Error", event);
         setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
      return;
    }

    // 2. Fallback to MediaRecorder + Gemini (Universal Compatibility)
    console.log("Using MediaRecorder Fallback");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Browsers record in webm/ogg
        setIsListening(false);
        setIsProcessingAudio(true);
        
        // Convert to Base64 and Transcribe
        try {
          const base64 = await blobToBase64(audioBlob);
          const text = await transcribeAudio(base64);
          if (text) setInputText(text);
        } catch (e) {
          console.error("Transcription failed", e);
        } finally {
          setIsProcessingAudio(false);
          // Stop all tracks to release mic
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Mic permission denied or error", err);
      alert("Microphone access denied. Please enable permissions.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!scenario) {
    return (
        <div className="flex flex-col h-full p-4 overflow-y-auto bg-emerald-50">
         <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-bold text-emerald-700">Let's Play!</h2>
             <button onClick={() => { stopAllAudio(); onBack(); }} className="text-emerald-400 font-bold">Back (返回)</button>
         </div>
         <p className="mb-4 text-emerald-600">Choose a place to play:</p>
         <div className="grid grid-cols-2 gap-4">
           {SCENARIOS.map(s => (
             <button 
               key={s.id}
               onClick={() => setScenario(s)}
               className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 hover:scale-105 transition flex flex-col items-center gap-2"
             >
               <span className="text-4xl">{s.emoji}</span>
               <span className="font-bold text-slate-700">{s.name}</span>
             </button>
           ))}
         </div>
       </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-emerald-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between border-b border-emerald-100">
        <div className="flex items-center gap-2">
           <div className="bg-emerald-100 p-2 rounded-full">
             <span className="text-xl">{scenario.emoji}</span>
           </div>
           <div>
             <h2 className="font-bold text-slate-800">{scenario.name}</h2>
             <p className="text-xs text-slate-400">Role Play</p>
           </div>
        </div>
        <button onClick={() => { stopAllAudio(); setScenario(null); }} className="text-slate-400 text-sm font-bold">Quit (退出)</button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl relative group ${
              msg.role === 'user' 
                ? 'bg-emerald-500 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-emerald-100 rounded-bl-none shadow-sm'
            }`}>
              <p className="text-lg leading-relaxed">{msg.text}</p>
              
              {/* Translation Display */}
              {msg.translation && (
                 <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 animate-fade-in">
                    <span className="text-sm text-emerald-600 font-bold">{msg.translation}</span>
                    <button 
                      onClick={() => handleTranslate(msg.id, msg.text)} 
                      disabled={playingMsgId === msg.id}
                      className="text-emerald-400 hover:text-emerald-600 bg-emerald-50 p-1 rounded-full"
                    >
                      {playingMsgId === msg.id && msg.translating === false ? <Loader2 size={16} className="animate-spin"/> : <Volume2 size={16} />}
                    </button>
                 </div>
              )}

              {/* Translation Loading */}
              {msg.translating && (
                 <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                   <Loader2 size={10} className="animate-spin" /> Translating...
                 </div>
              )}

              {/* Action Buttons for AI messages */}
              {msg.role === 'model' && (
                <div className="absolute -right-16 top-0 flex flex-col gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition">
                   <button 
                    onClick={() => handleSpeakText(msg.id, msg.text)}
                    disabled={playingMsgId === msg.id}
                    className="bg-white/50 p-2 rounded-full text-emerald-600 hover:bg-white shadow-sm"
                  >
                    {playingMsgId === msg.id && !msg.translating ? <Loader2 size={18} className="animate-spin"/> : <Volume2 size={18} />}
                  </button>
                  <button 
                    onClick={() => handleTranslate(msg.id, msg.text)}
                    disabled={msg.translating}
                    className="bg-white/50 p-2 rounded-full text-indigo-500 hover:bg-white shadow-sm disabled:opacity-50"
                  >
                    <Languages size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(loading || isProcessingAudio) && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-emerald-100 shadow-sm flex items-center gap-2">
               {isProcessingAudio ? <Loader2 className="animate-spin text-emerald-500" size={16}/> : (
                 <div className="flex gap-1">
                   <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-100"></span>
                   <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               )}
               <span className="text-xs text-slate-400">{isProcessingAudio ? "Transcribing (转换中)..." : "Typing..."}</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-emerald-100">
        <div className="flex gap-2 items-center">
          <button 
             onClick={toggleListening}
             disabled={isProcessingAudio}
             className={`p-3 rounded-xl transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
             {isListening ? <MicOff size={24}/> : <Mic size={24}/>}
          </button>
          
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Say something... (说点什么)"}
            disabled={isProcessingAudio}
            className="flex-1 bg-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />
          
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || loading || isProcessingAudio}
            className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition disabled:opacity-50 shadow-emerald-200 shadow-md"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolePlayActivity;