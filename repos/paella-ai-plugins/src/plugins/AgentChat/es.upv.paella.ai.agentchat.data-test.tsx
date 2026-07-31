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
        return "es.upv.paella.ai.content.data-test";
    }    

    async read(_context: string, key: string): Promise<AIAgentChatContentData | null> {        
        
        return `This is a test message from the AIAgentChatDataTestPlugin. It is used to test the data plugin functionality of the AIAgentChatPlugin. key = ${key}`;
        
    }
}