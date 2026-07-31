
import { useState } from "preact/hooks";
import AIAgentChatPlugin, { usePaellaPlugin } from "../es.upv.paella.ai.agentchat"
import ChatWelcome from "./ChatWelcome";
import { LoadingPage } from "./LoadingPage";
import {AgentChat} from "./AgentChat";

export const MainAppContent = () => {
    const paellaPlugin = usePaellaPlugin<AIAgentChatPlugin>();    
    const [showWelcomeView, setShowWelcomeView] = useState<boolean>(paellaPlugin.showWelcomeMessage);
    const [vectorStoreLoadingProgress, setVectorStoreLoadingProgress] = useState<number>(0);
    const [errorLoadingVectorStore, setErrorLoadingVectorStore] = useState<string | null>(null);

    const handleCloseWelcomeView = async () => {
        paellaPlugin.showWelcomeMessage = false;
        setShowWelcomeView(false);
        paellaPlugin.loadVectorStore(async (err, progress, total) => {
            setErrorLoadingVectorStore(err ? "Error loading vector store" : null);
            if (err) {
                console.error("Error loading vector store:", err);                
            }
            else {
                console.log(`Vector store loading progress: ${progress}/${total}`);                
                setVectorStoreLoadingProgress(progress / total);                                
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        });        
    };

    return (
        <>
            { showWelcomeView        
                ? <ChatWelcome onClick={handleCloseWelcomeView}/>
                : (vectorStoreLoadingProgress < 1)
                    ? <LoadingPage error={errorLoadingVectorStore} loadingProgress={vectorStoreLoadingProgress*100} />
                    : <AgentChat />
            }
        </>
        );
}