
import { useState } from "preact/hooks";
import AIAgentChatPlugin, { usePaellaPlugin } from "../es.upv.paella.ai.agentchat"
import ChatWelcome from "./ChatWelcome";


export const MainAppContent = () => {
    const paellaPlugin = usePaellaPlugin<AIAgentChatPlugin>();
    console.log(paellaPlugin);
    const [showWelcomeView, setShowWelcomeView] = useState<boolean>(paellaPlugin.showWelcomeMessage);
    const handleCloseWelcomeView = () => {
        paellaPlugin.showWelcomeMessage = false;
        setShowWelcomeView(false);
    };

    return (
        <div>
            { showWelcomeView        
                ? <ChatWelcome onClick={handleCloseWelcomeView}/>
                : <div>Chat content goes here</div>
            }
        </div>
        );
}