import AIAgentChatPlugin, { usePaellaPlugin } from "../es.upv.paella.ai.agentchat"
import { useState, useRef, useEffect } from 'preact/hooks';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import "./AgentChat.css";

type ChatMessage = { role: string; text: string; processing?: boolean }

export const AgentChat = () => {
  const paellaPlugin = usePaellaPlugin<AIAgentChatPlugin>();  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const submitMessage = async (e: Event): Promise<void> => {
    e.preventDefault();

    const newMessage: ChatMessage = { role: "human", text: inputMessage };
    setChatMessages([...chatMessages, newMessage]);
    setInputMessage("");
    setProcessing(true);
    console.log("submitMessage called");
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
                    {/* <span className="time">11:46</span> */}
                  </div>
                  {/* <MarkdownView className='markdown-view'
                                                                    markdown={msg.text}
                                                                    options={{ tables: true, emoji: true }}                                                            
                                                                /> */}
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </Markdown>

                </div>
              </li>
            )}
        </ul>
      </article>
      <footer>
        <form onSubmit={submitMessage}>
          <input ref={inputRef} type="text" value={inputMessage} title={paellaPlugin.player.translate("Type your message here")} onChange={(e) => setInputMessage(e.currentTarget.value)} disabled={processing} />
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
