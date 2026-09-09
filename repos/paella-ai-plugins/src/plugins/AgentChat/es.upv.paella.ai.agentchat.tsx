import { Plugin, InteractiveAreaPlugin, type InteractiveAreaPluginConfig } from '@asicupv/paella-core'
import { createContext, render, type ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { MainAppContent } from './ui/MainAppContent';
import PackagePluginModule from '../PackagePluginModule';
import type { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import type { ChatOpenAI } from "@langchain/openai";
import type { ReactAgent } from 'langchain';

const PaellaPluginContext = createContext<Plugin | null>(null);

export function usePaellaPlugin<T extends Plugin>(): T {
  const context = useContext(PaellaPluginContext);
  if (!context) {
    throw new Error("usePaellaPlugin must be used inside Preact");
  }
  return context as T;
};

type PreactContainerProps = {
    paellaPlugin: Plugin;
    children?: ComponentChildren;
};

const PreactContainer = ({paellaPlugin, children}: PreactContainerProps) => {    
    return (     
        <PaellaPluginContext.Provider value={paellaPlugin}>
            {children}
        </PaellaPluginContext.Provider>   
    );
};


export type LoadVectorStoreProgressCallback = (err: Error | null, progress: number, total: number) => Promise<void>;

export type LoadProgressCallback = (
    phase: 'model' | 'vectorstore',
    progress: number,
    total: number,
    text?: string
) => Promise<void>;




export interface Settings {
    modelType: 'openai';
    baseURL: string;
    apiKey: string;
    modelName: string;
    // temperature?: number;
    // maxTokens?: number;
    // frequecyPenalty?: number;
    // presencePenalty?: number;
    // systemPrompt?: string;
}

export interface AIAgentChatPluginconfig extends InteractiveAreaPluginConfig {
    dataContext?: string;
    agentName?: string;
    topK?: number;
    embeddingModel?: string;
    chunkSize?: number;
    chunkOverlap?: number;
    systemPrompt?: string;
    settings?: Partial<Settings>;
    allowCustomUserSettings?: boolean;
}

export default class AIAgentChatPlugin extends InteractiveAreaPlugin<AIAgentChatPluginconfig> {
    private _appRootElement: HTMLDivElement | null = null;
    private _vectorStore: MemoryVectorStore | null = null;
    private _userSettings: Settings | null = null;
    private _captions: string | null = null;
    agent: ReactAgent | null = null;
    showWelcomeMessage = true;

    getPluginModuleInstance() {
        return PackagePluginModule.Get();
    }

    getAriaLabel() {
        return this.player.translate('AI Chat bot');
    }

    getDescription() {
        return this.getAriaLabel();
    }


    get name() {
        return 'es.upv.paella.ai.agentChat';
    }

    get agentName() {
        return this.config.agentName || "AI Assistant";
    }

    get dataContext() {
        return this.config.dataContext || "agentchat.captions";
    }

    get topK() {
        return this.config.topK || 5;
    }

    get allowCustomUserSettings() {
        return this.config.allowCustomUserSettings ?? true;
    }
    
    get settings(): Settings {
        if (this._userSettings) {
            return this._userSettings;
        }

        if (this.allowCustomUserSettings) {
            const stored = localStorage.getItem(`${this.name}_settings`);
            if (stored) {
                try {
                    this._userSettings = JSON.parse(stored) as Settings;
                    return this._userSettings;
                }
                catch {
                    localStorage.removeItem(`${this.name}_settings`);
                }
            }
        }

        const modelType = this.config.settings?.modelType || 'openai';
        const baseURL = this.config.settings?.baseURL || "";
        const apiKey = this.config.settings?.apiKey || "";
        const modelName = this.config.settings?.modelName || "";

        return {
            modelType,
            baseURL,
            apiKey,
            modelName
        };
    }

    async updateSettings(newSettings: Settings, progressCallback?: LoadProgressCallback): Promise<void> {
        this._userSettings = { ...newSettings };
        if (this.allowCustomUserSettings) {
            localStorage.setItem(`${this.name}_settings`, JSON.stringify(newSettings));
        }
        if (progressCallback) {
            await this.loadAll(progressCallback);
        } else {
            this.agent = await this.createAgent();
        }
    }

    async isEnabled(): Promise<boolean> {
        try {
            this._captions = await this.player.data?.read(this.dataContext, "captions") ?? null;
        }
        catch {
            this._captions = null;
        }

        if (!this._captions) {
            this.player.log.warn(`${this.name}: No captions available. Plugin disabled.`);
            return false;
        }

        const settings = this.settings;
        if (!settings.apiKey || !settings.baseURL || !settings.modelName) {
            this.player.log.warn(
                `${this.name}: Missing LLM configuration (apiKey, baseURL, modelName). ` +
                `Set settings in the plugin config or via the Settings UI.`
            );
            return false;
        }

        return await super.isEnabled();
    }

    async getContent(): Promise<HTMLElement> {
        if (this._appRootElement === null) {
            this._appRootElement = document.createElement("div");        
            this._appRootElement.classList.add("AIAgentChatPlugin");

            const ReactNode = await this.getReactNode();
            
            render(
                <PreactContainer paellaPlugin={this}>{ReactNode}</PreactContainer>,
                this._appRootElement
            );
        }
        return this._appRootElement;
    }

    async getReactNode(): Promise<ComponentChildren> {
        return (<MainAppContent />);
    }


    async loadVectorStore(progressCallback: LoadVectorStoreProgressCallback = async () => {}) {
        try {            
            const { RecursiveCharacterTextSplitter } = await import("@langchain/classic/text_splitter");
            const { MemoryVectorStore } = await import("@langchain/classic/vectorstores/memory");
            const { HuggingFaceTransformersEmbeddings } = await import("@langchain/community/embeddings/huggingface_transformers");


            const embeddings = new HuggingFaceTransformersEmbeddings({
                model: this.config.embeddingModel ?? "Xenova/all-MiniLM-L6-v2"
            });
            this._vectorStore = new MemoryVectorStore(embeddings);

            const rawVttFile = this._captions;
            if (!rawVttFile) {
                throw new Error("No captions available for this video");
            }
            const cleanText = rawVttFile
                .replace(/WEBVTT\n\n/g, "") // Remove VTT header
                // .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\n/g, "") // Uncomment to strip timestamps
                .trim();
            
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: this.config.chunkSize ?? 2000,
                chunkOverlap: this.config.chunkOverlap ?? 200,
            });

            const videoChunks = await splitter.createDocuments([cleanText]);
            
            await progressCallback(null, 0, videoChunks.length);
            for (const [index, chunk] of videoChunks.entries()) {                
                await this._vectorStore.addDocuments([chunk]);
                await progressCallback(null, index + 1, videoChunks.length);
            }            
        }
        catch (error) {            
            this._vectorStore = null;
            throw error;
        }
    }

    async getModel(): Promise<ChatOpenAI> {
        const settings = this.settings;

        if (settings.modelType === "openai") {
            const { ChatOpenAI } = await import("@langchain/openai");
            return new ChatOpenAI({
                apiKey: settings.apiKey,
                modelName: settings.modelName,
                configuration: {
                    baseURL: settings.baseURL,
                },
            });
        }

        throw new Error(`Unsupported model type: "${settings.modelType}"`);
    }

    async createAgent() {
        const { tool } = await import("@langchain/core/tools");
        const { createAgent } = await import("langchain");
        const { MemorySaver } = await import("@langchain/langgraph");
        const { z } = await import("zod");
        
        const searchInClassTool = tool(
            async ({ query }) => {
                const results = await this._vectorStore!.similaritySearchWithScore(query, this.topK);                
                const formatted = results.map((res, i) => {
                    const doc = res[0];    // The document (text and metadata)
                    const score = res[1];  // The similarity score
    
                    return `Result ${i + 1} (Score: ${score}):\n${doc.pageContent}\n`;
                });
    
                const response = `--- SEARCH RESULTS ---\n${formatted.join("\n")}`;
                return response;                
            },
            {
                name: "search_in_class",
                description: "Search for specific information within the transcript or notes of the current video class. Always use it when the user asks about the class content.",
                schema: z.object({
                    query: z.string().describe("The specific question or concept to search for in the class"),
                }),
            }
        );
                    
        const getTotalChunksTool = tool(
            async () => {
                const total = this._vectorStore!.memoryVectors.length;
                return `The current document is divided into ${total} chunks.`;
            },
            {
                name: "get_total_chunks",
                description: "Returns the total number of chunks the current class transcript has been divided into. Use it if the user asks how many chunks there are or what the database size is.",
                schema: z.object({}),
            }
        );
                
        const getChunkByIndexTool = tool(
            async ({ index }) => {
                const total = this._vectorStore!.memoryVectors.length;
                
                
                if (index < 0 || index >= total) {
                    return `Error: Index ${index} is out of range. Please provide an index between 0 and ${total - 1}.`;
                }
                        
                const chunk = this._vectorStore!.memoryVectors[index];
                return `--- CHUNK ${index} CONTENT ---\n${chunk.content}`;
            },
            {
                name: "get_chunk_by_index",
                description: "Returns the exact text of a specific chunk by its numeric index. Use it if the user asks to read a particular chunk.",
                schema: z.object({
                    index: z.number().int().describe("The numeric index of the chunk to retrieve. Must be an integer starting from 0."),
                }),
            }
        );


        const systemPrompt = this.config.systemPrompt ?? `You are a virtual assistant from the Universidad Politécnica de Valencia (UPV). Your main goal is to help students resolve questions about the video or class they are watching.
        
        You have three tools available:
        - 'search_in_class': To search for concepts, topics or details within the class content.
        - 'get_total_chunks': To find out how many chunks the transcript is divided into.
        - 'get_chunk_by_index': To read the exact text of a specific chunk.
        
        STRICT RULES:
        1. CONTENT SEARCH: When the user asks about any concept, topic or detail from the class, you MUST use the 'search_in_class' tool. 
        2. ZERO HALLUCINATIONS: NEVER make up information or answer based on your general knowledge if they ask about the video content. Base your answer ONLY on the information returned by your tools.
        3. ERROR HANDLING: If the search tool returns nothing, or if a chunk is empty, kindly tell the user that topic is not mentioned in the current video or that the chunk does not contain information.
        4. TONE: Respond clearly, concisely, and in an academic but approachable tone.`;
        

        const model = await this.getModel();

        const checkpointer = new MemorySaver();
        const agent = createAgent({
            model,
            checkpointer: checkpointer,
            tools: [
                searchInClassTool,
                getTotalChunksTool,
                getChunkByIndexTool
            ],
            systemPrompt: systemPrompt,
        });
    
        return agent;
    }

    async loadVectorStoreAndCreateAgent(progressCallback: LoadVectorStoreProgressCallback = async () => {}) {
        await this.loadVectorStore(progressCallback);
        this.agent = await this.createAgent();
    }

    async loadAll(progressCallback: LoadProgressCallback) {
        // 1. Load vector store first
        await this.loadVectorStore(async (err, progress, total) => {
            await progressCallback('vectorstore', progress, total);
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // 2. Load model
        await this.getModel();

        // 3. Create agent
        this.agent = await this.createAgent();
    }
}
