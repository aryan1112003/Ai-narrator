import React, { useState, useEffect } from 'react';
import { Upload, Volume2, Download, Pause, Play, Github, Linkedin } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

function App() {
  const [extractedText, setExtractedText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      setSelectedVoice(availableVoices[0]);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // Cleanup
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const convertPDF = async (file: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      const pdfDoc = await pdfjs.getDocument({ data: pdfData }).promise;
      const numPages = pdfDoc.numPages;

      let allText = '';
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
        allText += pageText + '\n\n';
      }

      setExtractedText(allText);
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Error converting PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      convertPDF(file);
    }
  };

  const downloadText = () => {
    if (!extractedText) {
      alert('No text available to download. Please convert a PDF first.');
      return;
    }

    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extracted_text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!extractedText) {
        alert('No text available to read. Please convert a PDF first.');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(extractedText);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
          <h1 className="text-3xl font-bold text-gray-100 mb-6">Ai Narrator</h1>
          
          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <Upload size={20} />
                Upload PDF
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={downloadText}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!extractedText}
              >
                <Download size={20} />
                Download Text
              </button>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = voices.find(v => v.name === e.target.value);
                  if (voice) setSelectedVoice(voice);
                }}
                className="px-4 py-2 bg-gray-700 border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>

              <button
                onClick={toggleSpeech}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!extractedText}
              >
                {isSpeaking ? <Pause size={20} /> : <Play size={20} />}
                {isSpeaking ? 'Pause' : 'Read Aloud'}
              </button>
            </div>
          </div>

          {/* Text Display */}
          <div className="mt-6">
            <div className="border border-gray-700 rounded-lg p-4 min-h-[400px] bg-gray-800">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Converting PDF, please wait...</p>
                </div>
              ) : extractedText ? (
                <p className="whitespace-pre-wrap font-serif text-gray-100 leading-relaxed">
                  {extractedText}
                </p>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Upload a PDF to see its contents here</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer with watermark and copyright */}
          <div className="mt-8 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center text-gray-400 text-sm">
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/aryan1112003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-gray-100 transition-colors"
                >
                  <Github size={16} />
                  aryan1112003
                </a>
                <a
                  href="https://www.linkedin.com/in/aryan-acharya-9b939b316/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-gray-100 transition-colors"
                >
                  <Linkedin size={16} />
                  Aryan Acharya
                </a>
              </div>
              <div>
                © {new Date().getFullYear()} Aryan Acharya. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;