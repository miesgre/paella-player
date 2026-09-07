import AIAgentChatPlugin, { usePaellaPlugin } from "../es.upv.paella.ai.agentchat"
import type { Settings } from "../es.upv.paella.ai.agentchat"
import { useState, useRef, useEffect } from 'preact/hooks';
import { marked } from 'marked';
import { UserSettings } from "./UserSettings";
import { LoadingPage } from "./LoadingPage";
import "./AgentChat.css";

marked.setOptions({ gfm: true, breaks: true });

const TS = /\d{1,2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?/g;

function formatMarkdown(text: string): string {
  let html = marked.parse(text) as string;
  html = html.replace(TS, (m) =>
    `<a class="timestamp-link" href="#" data-ts="${m}">${m}</a>`
  );
  return html;
}

type Segment =
  | { type: "reasoning"; text: string }
  | { type: "tool"; name: string; args: string };

type ChatMessage = {
  role: string;
  segments: Segment[];
  response: string;
  processing?: boolean;
}

function ReasoningBlock({ segments, processing }: { segments: Segment[]; processing?: boolean }) {
  const paellaPlugin = usePaellaPlugin<AIAgentChatPlugin>();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!processing) setOpen(false);
  }, [processing]);

  if (!segments.length) return null;

  return (
    <details open={open} className="reasoning-block">
      <summary onClick={(e) => { e.preventDefault(); setOpen(!open); }}>
        {processing ? paellaPlugin.player.translate("Thinking...") : paellaPlugin.player.translate("Reasoning")}
      </summary>
      {open && (
        <div className="reasoning-body">
          {segments.map((seg, i) =>
            seg.type === "reasoning"
              ? <div key={i} className="reasoning-text">{seg.text}</div>
              : <div key={i} className="reasoning-tools">{`Tool: ${seg.name}(${seg.args})`}</div>
          )}
        </div>
      )}
    </details>
  );
}

export const AgentChat = () => {
  const paellaPlugin = usePaellaPlugin<AIAgentChatPlugin>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [applyingSettings, setApplyingSettings] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<'model' | 'vectorstore' | null>(null);
  const [modelProgress, setModelProgress] = useState<number>(0);
  const [modelText, setModelText] = useState<string>("");
  const [vectorStoreProgress, setVectorStoreProgress] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const wasAtBottomRef = useRef(true);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const checkIfAtBottom = () => {
    const article = listRef.current?.closest("article");
    if (!article) return;
    const threshold = 50;
    const atBottom = article.scrollHeight - article.scrollTop - article.clientHeight < threshold;
    wasAtBottomRef.current = atBottom;
  };

  useEffect(() => {
    if (!wasAtBottomRef.current) return;
    const article = listRef.current?.closest("article");
    if (article) {
      article.scrollTop = article.scrollHeight;
    }
  }, [chatMessages]);

  const sendAndProcessMessage = async (userQuestion: string) => {
    const stream = await paellaPlugin.agent?.streamEvents(
      { messages: [{ role: "user", content: userQuestion }] },
      {
        version: "v3",
        configurable: {
          thread_id: "memeory_thread_id",
        },
      },
    );

    if (!stream) {
      console.error("No stream returned from agent");
      setProcessing(false);
      return;
    }

    const yieldToRender = () => new Promise<void>(resolve => setTimeout(resolve, 0));

    let segments: Segment[] = [];
    let currentReasoning = "";
    let currentText = "";

    const flushUpdate = async () => {
      setChatMessages(prev =>
        prev.map(m => m.processing ? { ...m, segments, response: currentText } : m)
      );
      await yieldToRender();
    };

    const flushReasoning = () => {
      if (currentReasoning) {
        segments.push({ type: "reasoning", text: currentReasoning });
        currentReasoning = "";
      }
    };

    try {
      for await (const message of stream.messages) {
        for await (const _delta of message.usage) { /* skip */ }

        for await (const delta of message.reasoning) {
          if (currentText) {
            flushReasoning();
            segments.push({ type: "reasoning", text: currentText });
            currentText = "";
          }
          currentReasoning += delta;
          await flushUpdate();
        }

        for await (const delta of message.text) {
          currentText += delta;
          await flushUpdate();
        }

        for await (const delta of message.toolCalls) {
          const name = delta.name ?? "tool";
          const args = Object.entries(delta.args ?? {})
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(", ");
          if (currentText) {
            flushReasoning();
            segments.push({ type: "reasoning", text: currentText });
            currentText = "";
          }
          flushReasoning();
          segments.push({ type: "tool", name, args });
          await flushUpdate();
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      currentText += `\n\nError: ${err}`;
      await flushUpdate();
    }

    // Flush final
    await flushUpdate();

    // Mark message as completed
    setChatMessages(prev =>
      prev.map(m => {
        if (!m.processing) return m;
        const { processing: _, ...done } = m;
        return done;
      })
    );
    setProcessing(false);
  }

  const submitMessage = async (e: Event): Promise<void> => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || processing) return;

    checkIfAtBottom();

    const userMessage: ChatMessage = { role: "human", segments: [], response: text };
    const processingMessage: ChatMessage = { role: "system", segments: [], response: "", processing: true };

    setChatMessages(prev => [...prev, userMessage, processingMessage]);
    setInputMessage("");
    setProcessing(true);

    await sendAndProcessMessage(text);
  }

  const handleSaveSettings = async (newSettings: Settings) => {
    setShowSettings(false);
    setApplyingSettings(true);
    try {
      await paellaPlugin.updateSettings(newSettings, async (phase, progress, total, text) => {
        setLoadingPhase(phase);
        if (phase === 'model') {
          setModelProgress(progress);
          if (text) setModelText(text);
        } else {
          setVectorStoreProgress(progress / total);
        }
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    } finally {
      setApplyingSettings(false);
      setLoadingPhase(null);
    }
  };

  const handleTimestampClick = (ts: string) => alert(`Timestamp: ${ts}`);

  const responseRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = responseRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("timestamp-link")) {
        e.preventDefault();
        handleTimestampClick(target.dataset.ts ?? target.textContent ?? "");
      }
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [chatMessages]);

  if (showSettings) {
    return <UserSettings settings={paellaPlugin.settings} onClose={() => setShowSettings(false)} onSave={handleSaveSettings} />;
  }

  if (applyingSettings && loadingPhase) {
    return <LoadingPage
      phase={loadingPhase}
      modelProgress={modelProgress}
      modelText={modelText}
      vectorStoreProgress={vectorStoreProgress * 100}
      error={null}
    />;
  }

  return (
    <div className="chat-content">
      <article>
        <ul ref={listRef}>
          {chatMessages?.map((msg, i) =>
              <li key={i} className={`chat-message msg-role-${msg.role}`}>
                {msg.role === "human"
                  ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z"></path>
                    <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z"></path>
                  </svg>
                  : (
                    msg.role === "system" && msg.processing
                      ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" strokeWidth="2">
                        <path d="M6.5 7h11"></path>
                        <path d="M6.5 17h11"></path>
                        <path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z"></path>
                        <path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z"></path>
                      </svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" strokeWidth="2">
                        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"></path>
                        <path d="M9.5 9h.01"></path>
                        <path d="M14.5 9h.01"></path>
                        <path d="M9.5 13a3.5 3.5 0 0 0 5 0"></path>
                      </svg>
                  )
                }

                <div>
                  <div className="header">
                    <span className="user">
                      {msg.role === "human" ? paellaPlugin.player.translate("You") : paellaPlugin.player.translate("Assistant")}
                    </span>
                  </div>
                  <ReasoningBlock segments={msg.segments} processing={msg.processing} />
                  {msg.response &&
                    <div
                      ref={responseRef}
                      className="chat-response"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.response) }}
                    />
                  }
                </div>
              </li>
            )}
        </ul>
      </article>
      <footer>
        <form onSubmit={submitMessage}>
          <input ref={inputRef} type="text" value={inputMessage} title={paellaPlugin.player.translate("Type your message here")} onChange={(e) => setInputMessage(e.currentTarget.value)} />
          <button type="submit" disabled={processing}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" strokeWidth="2">
              <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4"></path>
            </svg>
            {paellaPlugin.player.translate("Send")}
          </button>
          {paellaPlugin.allowCustomUserSettings && (
            <button type="button" disabled={processing} onClick={() => setShowSettings(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-settings2-icon lucide-settings-2"><path d="M14 17H5"/><path d="M19 7h-9"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
              {paellaPlugin.player.translate("Settings")}
            </button>
          )}
        </form>
      </footer>
    </div>
  );
};
