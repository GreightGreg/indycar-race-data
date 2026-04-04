import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useRaceContext } from '@/contexts/RaceContext';
import { useRaceDetails } from '@/hooks/useRaceData';
import ReactMarkdown from 'react-markdown';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/race-chat`;
const MAX_QUESTIONS = 5;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const StarterChips = ({
  raceName,
  onSelect,
}: {
  raceName: string;
  onSelect: (q: string) => void;
}) => {
  const raceChips = [
    `Why did the winner win at ${raceName}?`,
    'Who led the most laps?',
    'Which driver improved most from qualifying to race?',
    'Who had the fastest pit stops?',
  ];
  const seasonChips = [
    'Who leads the championship?',
    'Which team has been most consistent?',
    'Who has led the most laps this season?',
    'How are the engine manufacturers comparing?',
  ];

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="font-condensed text-[13px] text-racing-muted uppercase tracking-wider">
        This race
      </p>
      <div className="flex flex-wrap gap-2">
        {raceChips.map((chip) => (
          <button
            key={chip}
            onClick={() => onSelect(chip)}
            className="text-left px-3 py-2 rounded-lg border border-racing-border text-[13px] font-body text-[#8fafc7] hover:border-racing-yellow hover:text-racing-yellow transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
      <p className="font-condensed text-[13px] text-racing-muted uppercase tracking-wider mt-2">
        Season
      </p>
      <div className="flex flex-wrap gap-2">
        {seasonChips.map((chip) => (
          <button
            key={chip}
            onClick={() => onSelect(chip)}
            className="text-left px-3 py-2 rounded-lg border border-racing-border text-[13px] font-body text-[#8fafc7] hover:border-racing-yellow hover:text-racing-yellow transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};

const LoadingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    <div className="w-2 h-2 rounded-full bg-racing-yellow animate-pulse" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 rounded-full bg-racing-yellow animate-pulse" style={{ animationDelay: '200ms' }} />
    <div className="w-2 h-2 rounded-full bg-racing-yellow animate-pulse" style={{ animationDelay: '400ms' }} />
  </div>
);

const RaceChatPanel = () => {
  const { raceId } = useRaceContext();
  const { data: race } = useRaceDetails(raceId);

  const [isOpen, setIsOpen] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinShake, setPinShake] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleChatButtonClick = () => {
    if (pinVerified) {
      setIsOpen(true);
    } else {
      setShowPinOverlay(true);
      setPinValue('');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinValue === '1013') {
      setPinVerified(true);
      setShowPinOverlay(false);
      setIsOpen(true);
    } else {
      setPinShake(true);
      setPinValue('');
      setTimeout(() => setPinShake(false), 500);
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || questionsUsed >= MAX_QUESTIONS) return;

      const userMsg: ChatMessage = { role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);
      setQuestionsUsed((prev) => prev + 1);

      let assistantSoFar = '';

      try {
        const resp = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            question: text.trim(),
            raceId,
            year: race?.year,
          }),
        });

        if (!resp.ok || !resp.body) {
          const errData = await resp.json().catch(() => null);
          const errMsg = errData?.error || 'Unable to reach the AI right now. Please try again.';
          setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
          setIsLoading(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantSoFar += content;
                const currentContent = assistantSoFar;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: currentContent } : m));
                  }
                  return [...prev, { role: 'assistant', content: currentContent }];
                });
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantSoFar += content;
                const currentContent = assistantSoFar;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: currentContent } : m));
                  }
                  return [...prev, { role: 'assistant', content: currentContent }];
                });
              }
            } catch { /* ignore */ }
          }
        }

        // If no content was received
        if (!assistantSoFar) {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Unable to reach the AI right now. Please try again.' }]);
        }
      } catch (e) {
        console.error('Chat error:', e);
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Unable to reach the AI right now. Please try again.' }]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, questionsUsed, raceId, race?.year],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const remaining = MAX_QUESTIONS - questionsUsed;
  const limitReached = remaining <= 0;
  const raceName = race?.event_name || 'this race';

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={handleChatButtonClick}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ background: '#0d1620', border: '2px solid #1e2e40' }}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" style={{ color: '#e8ff00' }} />
        </button>
      )}

      {/* PIN overlay */}
      {showPinOverlay && !pinVerified && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div
            className="rounded-xl p-6 w-[300px] flex flex-col items-center gap-4 shadow-2xl"
            style={{ background: '#0d1620', border: '1px solid #1e2e40' }}
          >
            <p className="font-condensed text-[13px] text-racing-muted uppercase tracking-wider">
              Beta Access Required
            </p>
            <form onSubmit={handlePinSubmit} className="flex flex-col items-center gap-3 w-full">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter PIN"
                autoFocus
                className={`w-full text-center text-[24px] font-mono tracking-[0.5em] px-4 py-3 rounded-lg text-racing-text placeholder:text-racing-muted outline-none ${pinShake ? 'animate-shake' : ''}`}
                style={{ background: '#080e14', border: '1px solid #1e2e40' }}
              />
              <button
                type="submit"
                disabled={pinValue.length !== 4}
                className="w-full py-2.5 rounded-lg font-condensed font-semibold text-[15px] uppercase tracking-wider transition-colors disabled:opacity-30"
                style={{ background: '#e8ff00', color: '#080e14' }}
              >
                Submit
              </button>
            </form>
            <button
              onClick={() => setShowPinOverlay(false)}
              className="text-[13px] font-condensed text-racing-muted hover:text-racing-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed z-50 flex flex-col shadow-2xl
            bottom-0 right-0 w-full h-full
            md:bottom-5 md:right-5 md:w-[380px] md:h-[520px] md:rounded-xl md:border"
          style={{
            background: '#080e14',
            borderColor: '#1e2e40',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid #1e2e40', background: '#0d1620' }}
          >
            <div className="flex flex-col">
              <span className="font-heading text-[18px] text-racing-yellow tracking-wide">
                RACEDAY PADDOCK AI
              </span>
              {race && (
                <span className="font-condensed text-[12px] text-racing-muted truncate max-w-[250px]">
                  {race.event_name} — R{race.round_number}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded hover:bg-racing-surface2 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-racing-muted" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && !isLoading && (
              <StarterChips raceName={raceName} onSelect={sendMessage} />
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[14px] font-body ${
                    msg.role === 'user'
                      ? 'text-racing-bg'
                      : 'text-[#dce8f0]'
                  }`}
                  style={{
                    background: msg.role === 'user' ? '#e8ff00' : '#111d2b',
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_strong]:text-racing-yellow">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && <LoadingDots />}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 px-3 pb-3 pt-2"
            style={{ borderTop: '1px solid #1e2e40' }}
          >
            {limitReached ? (
              <p className="text-center text-[13px] font-condensed text-racing-muted py-2">
                Session limit reached. Refresh to start a new session.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about the race..."
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 rounded-lg text-[14px] font-body text-racing-text placeholder:text-racing-muted outline-none disabled:opacity-50"
                    style={{ background: '#0d1620', border: '1px solid #1e2e40' }}
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 rounded-lg transition-colors disabled:opacity-30"
                    style={{ background: '#e8ff00' }}
                  >
                    <Send className="w-4 h-4 text-racing-bg" />
                  </button>
                </div>
                <p className="text-[11px] font-mono text-racing-muted mt-1.5 text-right">
                  {remaining} question{remaining !== 1 ? 's' : ''} remaining
                </p>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
};

export default RaceChatPanel;