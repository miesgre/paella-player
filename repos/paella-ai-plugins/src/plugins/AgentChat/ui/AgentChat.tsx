import AIAgentChatPlugin, { usePaellaPlugin } from "../es.upv.paella.ai.agentchat"
import { useState, useRef, useEffect } from 'preact/hooks';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import "./AgentChat.css";

type Segment =
  | { type: "reasoning"; content: string }
  | { type: "text"; content: string }
  | { type: "tools"; content: string };

type ChatMessage = {
  role: string;
  segments: Segment[];
  processing?: boolean;
}

function ReasoningBlock({ segment, processing }: { segment: Segment; processing?: boolean }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!processing) setOpen(false);
  }, [processing]);

  return (
    <details open={open} className="reasoning-block">
      <summary onClick={(e) => { e.preventDefault(); setOpen(!open); }}>
        {processing ? "Pensando..." : "Razonamiento"}
      </summary>
      {open && (
        <div className="reasoning-body">
          <div className="reasoning-text">{segment.content}</div>
        </div>
      )}
    </details>
  );
}

function ToolsBlock({ segment }: { segment: Segment }) {
  return (
    <div className="tools-block">
      <div className="tools-label">Tool calls</div>
      <pre className="tools-body">{segment.content}</pre>
    </div>
  );
}

export const AgentChat = () => {
  const paellaPlugin = usePaellaPlugin<AIAgentChatPlugin>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

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

    // Segmentos ya terminados + el segmento en progreso por cada tipo
    const committed: Segment[] = [];
    let reasoningSeg: Segment = { type: "reasoning", content: "" };
    let textSeg: Segment = { type: "text", content: "" };
    let toolsSeg: Segment = { type: "tools", content: "" };

    // Cierra el segmento en progreso: lo muesta a committed y crea uno nuevo vacío
    const commitSegment = (seg: Segment, factory: () => Segment): Segment => {
      if (seg.content) committed.push(seg);
      return factory();
    };

    const flushUpdate = async () => {
      // La lista final = committed + los 3 segmentos en progreso (si tienen contenido)
      const allSegments = [
        ...committed,
        ...(reasoningSeg.content ? [reasoningSeg] : []),
        ...(toolsSeg.content ? [toolsSeg] : []),
        ...(textSeg.content ? [textSeg] : []),
      ];
      setChatMessages(prev =>
        prev.map(m => m.processing ? { ...m, segments: allSegments } : m)
      );
      await yieldToRender();
    };

    try {
      for await (const message of stream.messages) {
        for await (const _delta of message.usage) { /* skip */ }

        for await (const delta of message.reasoning) {
          // Si habia texto o tools en progreso, commitearlos primero
          textSeg = commitSegment(textSeg, () => ({ type: "text", content: "" }));
          toolsSeg = commitSegment(toolsSeg, () => ({ type: "tools", content: "" }));
          reasoningSeg.content += delta;
          await flushUpdate();
        }

        for await (const delta of message.text) {
          // Si habia reasoning o tools en progreso, commitearlos primero
          reasoningSeg = commitSegment(reasoningSeg, () => ({ type: "reasoning", content: "" }));
          toolsSeg = commitSegment(toolsSeg, () => ({ type: "tools", content: "" }));
          textSeg.content += delta;
          await flushUpdate();
        }

        for await (const delta of message.toolCalls) {
          const name = delta.name ?? "tool";
          const args = Object.entries(delta.args ?? {})
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(", ");
          // Si habia reasoning o text en progreso, commitearlos primero
          reasoningSeg = commitSegment(reasoningSeg, () => ({ type: "reasoning", content: "" }));
          textSeg = commitSegment(textSeg, () => ({ type: "text", content: "" }));
          toolsSeg.content += `${name}(${args})\n`;
          await flushUpdate();
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      textSeg.content += `\n\nError: ${err}`;
      await flushUpdate();
    }

    // Flush final: commitear todo lo que quede en progreso
    commitSegment(reasoningSeg, () => ({ type: "reasoning", content: "" }));
    commitSegment(textSeg, () => ({ type: "text", content: "" }));
    commitSegment(toolsSeg, () => ({ type: "tools", content: "" }));

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

    const userMessage: ChatMessage = { role: "human", segments: [{ type: "text", content: text }] };
    const processingMessage: ChatMessage = { role: "system", segments: [], processing: true };

    setChatMessages(prev => [...prev, userMessage, processingMessage]);
    setInputMessage("");
    setProcessing(true);

    await sendAndProcessMessage(text);
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
                  {msg.segments.map((seg, j) => {
                    if (seg.type === "reasoning") {
                      return <ReasoningBlock key={j} segment={seg} processing={msg.processing} />;
                    }
                    if (seg.type === "tools") {
                      return <ToolsBlock key={j} segment={seg} />;
                    }
                    return (
                      <Markdown key={j} remarkPlugins={[remarkGfm]}>
                        {seg.content}
                      </Markdown>
                    );
                  })}
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
        </form>
      </footer>
    </div>
  );
};
