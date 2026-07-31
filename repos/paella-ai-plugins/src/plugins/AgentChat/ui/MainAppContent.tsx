
import { useState } from "preact/hooks";
import AIAgentChatPlugin, { usePaellaPlugin } from "../es.upv.paella.ai.agentchat"
import ChatWelcome from "./ChatWelcome";


export const MainAppContent = () => {
    const paellaPlugin = usePaellaPlugin<AIAgentChatPlugin>();    
    const [showWelcomeView, setShowWelcomeView] = useState<boolean>(paellaPlugin.showWelcomeMessage);
    const [vectorStoreLoadingProgress, setVectorStoreLoadingProgress] = useState<number>(0);

    const handleCloseWelcomeView = async () => {
        paellaPlugin.showWelcomeMessage = false;
        setShowWelcomeView(false);
        paellaPlugin.loadVectorStore((err, progress, total) => {
            if (err) {
                console.error("Error loading vector store:", err);
            }
            else {
                console.log(`Vector store loading progress: ${progress}/${total}`);
                setVectorStoreLoadingProgress(progress / total);
            }
        });        
    };

    return (
        <div>
            { showWelcomeView        
                ? <ChatWelcome onClick={handleCloseWelcomeView}/>
                : <div>Loading Progress: {Math.round(vectorStoreLoadingProgress * 100)}%</div>
            }
        </div>
        );
}