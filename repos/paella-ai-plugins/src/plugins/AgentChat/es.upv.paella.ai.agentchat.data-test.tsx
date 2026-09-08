import { DataPlugin, type DataPluginConfig } from '@asicupv/paella-core';
import PackagePluginModule from '../PackagePluginModule';



export type AIAgentChatContentData = string | null;


export class AIAgentChatDataPlugin<C extends DataPluginConfig> extends DataPlugin<C, AIAgentChatContentData> {
    async read(_context: string, key: string): Promise<AIAgentChatContentData> {     
        return null;
    }
}






export interface AIAgentChatDataTestPluginConfig extends DataPluginConfig {    
};


export class AIAgentChatDataTestPlugin extends AIAgentChatDataPlugin<AIAgentChatDataTestPluginConfig> {
    getPluginModuleInstance() {
        return PackagePluginModule.Get();
    }

    get name() {
        return "es.upv.paella.ai.agentchat.data";
    }    

    async read(_context: string, key: string): Promise<AIAgentChatContentData | null> {

        const url = `${this.player.repositoryUrl}/${this.player.videoId}/captions.es.vtt`;

        // Read the file content
        let content = await fetch(url)
            .then(async (response) => {
                if (!response.ok) {                        
                    return null;
                }
                else {
                    return await response.text();
                }
            });
        
        return content;
        
    }
}