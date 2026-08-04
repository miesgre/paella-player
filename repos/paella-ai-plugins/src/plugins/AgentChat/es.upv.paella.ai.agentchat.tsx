import { Plugin, InteractiveAreaPlugin, type InteractiveAreaPluginConfig } from '@asicupv/paella-core'
import { createContext, render, type ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { MainAppContent } from './ui/MainAppContent';
import PackagePluginModule from '../PackagePluginModule';
import type { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
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


export type LoadVectorStoteProgressCallback = (err: Error | null, progress: number, total: number) => Promise<void>;




export interface Settings {
    modelType: 'webllm' | 'openai';
    baseURL: string;
    apiKey: string;
    modelName: string;
    contextWindowLength: number;
    // temperature?: number;
    // maxTokens?: number;
    // frequecyPenalty?: number;
    // presencePenalty?: number;
    // systemPrompt?: string;
}

export interface AIAgentChatPluginconfig extends InteractiveAreaPluginConfig {
    dataContext?: string; // Optional context for the data source
    agentName?: string; // Optional name for the agent
    topK?: number; // Optional number of top results to retrieve from the vector store

    settings?: Partial<Settings>; // Settings for the agent
    allowCustomUserSettings?: boolean; // Optional flag to allow users to select the model/provider
}

export default class AIAgentChatPlugin extends InteractiveAreaPlugin<AIAgentChatPluginconfig> {
    private _appRootElement: HTMLDivElement | null = null;
    private _vectorStore: MemoryVectorStore | null = null;
    agent: ReactAgent | null = null;
    showWelcomeMessage = true;

    getPluginModuleInstance() {
        return PackagePluginModule.Get();
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

    get settings(): Settings {
        // TODO: Read User settings from localStorage or other storage if allowCustomUserSettings is true
        const modelType = this.config.settings?.modelType || 'openai';
        const baseURL = this.config.settings?.baseURL || `${location.origin}/api/opencode/zen/v1`;
        const apiKey = this.config.settings?.apiKey || "dummy";
        const modelName = this.config.settings?.modelName || 'big-pickle';
        const contextWindowLength = this.config.settings?.contextWindowLength || 100_000;

        return {
            modelType,
            baseURL,
            apiKey,
            modelName,
            contextWindowLength
        };
    }

    async isEnabled(): Promise<boolean> {
        const data = await this.player.data?.read(this.dataContext, "captions");
        console.log(`AIAgentChatPlugin.isEnabled: data = ${data}`);

        // TODO: check REST endpoint 
        const enabled = await super.isEnabled();
        return enabled;
    }

    async getContent(): Promise<HTMLElement> {
        if (this._appRootElement === null) {
            this._appRootElement = document.createElement("div");        
            this._appRootElement.classList.add("AIAgentChatPlugin");

            const ReactNode = await this.getReactNode();
            
            render(
                <PreactContainer paellaPlugin={this} children={ReactNode} />,
                this._appRootElement
            );
        }
        return this._appRootElement;
    }

    async getReactNode(): Promise<ComponentChildren> {
        return (<MainAppContent />);
    }


    async loadVectorStore(progressCallback: LoadVectorStoteProgressCallback = async () => {}) {
        try {            
            const { RecursiveCharacterTextSplitter } = await import("@langchain/classic/text_splitter");
            const { MemoryVectorStore } = await import("@langchain/classic/vectorstores/memory");
            const { HuggingFaceTransformersEmbeddings } = await import("@langchain/community/embeddings/huggingface_transformers");


            const embeddings = new HuggingFaceTransformersEmbeddings({
                model: "Xenova/all-MiniLM-L6-v2"
            });
            this._vectorStore = new MemoryVectorStore(embeddings);



            const rawVttFile = await this.player.data?.read(this.dataContext, "captions");        
            const cleanText = rawVttFile
                .replace(/WEBVTT\n\n/g, "") // Elimina la cabecera
                // .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\n/g, "") // Descomenta esto para quitar los timestamps
                .trim();
            
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 2000,
                chunkOverlap: 200,
            });

            const videoChunks = await splitter.createDocuments([cleanText]);
            
            progressCallback(null, 0, videoChunks.length);
            for (const [index, chunk] of videoChunks.entries()) {                
                await this._vectorStore.addDocuments([chunk]);
                await progressCallback(null, index + 1, videoChunks.length);
            }            
        }
        catch (error) {            
            this._vectorStore = null;
            progressCallback(error as Error, 0, 0);
        }
    }

    async createAgent() {
        const { tool } = await import("@langchain/core/tools");
        const { createAgent } = await import("langchain");
        const { ChatOpenAI } = await import("@langchain/openai");
        const { MemorySaver } = await import("@langchain/langgraph");
        const { z } = await import("zod");
        
        const searchInClassTool = tool(
            async ({ query }) => {
                const resultados = await this._vectorStore!.similaritySearchWithScore(query, 5);                
                const rr = resultados.map((res, i) => {
                    const doc = res[0];    // El documento (texto y metadatos)
                    const score = res[1];  // La puntuación de similitud
    
                    return `Resultado ${i + 1} (Score: ${score}):\n${doc.pageContent}\n`;
                });
    
                const response = `--- RESULTADOS DE LA BÚSQUEDA ---\n${rr.join("\n")}`;
                return response;                
            },
            {
                name: "search_in_class",
                description: "Busca información específica dentro del transcrito o los apuntes de la clase de video actual. Úsala siempre que el usuario pregunte sobre el contenido de la clase.",
                schema: z.object({
                    query: z.string().describe("La pregunta o concepto específico que se desea buscar en la clase"),
                }),
            }
        );
                    
        const getTotalChunksTool = tool(
            async () => {
                const total = this._vectorStore!.memoryVectors.length;
                return `El documento actual está dividido en ${total} fragmentos (chunks).`;
            },
            {
                name: "get_total_chunks",
                description: "Devuelve el número total de fragmentos (chunks) en los que se ha dividido la transcripción de la clase actual. Úsala si el usuario pregunta cuántos fragmentos hay o cuál es el tamaño de la base de datos.",
                schema: z.object({}),
            }
        );
                
        const getChunkByIndexTool = tool(
            async ({ index }) => {
                const total = this._vectorStore!.memoryVectors.length;
                
                
                if (index < 0 || index >= total) {
                    return `Error: El índice ${index} está fuera de rango. Por favor, pide un índice entre 0 y ${total - 1}.`;
                }
                        
                const chunk = this._vectorStore!.memoryVectors[index];
                return `--- CONTENIDO DEL CHUNK ${index} ---\n${chunk.content}`;
            },
            {
                name: "get_chunk_by_index",
                description: "Devuelve el texto exacto de un fragmento (chunk) específico mediante su índice numérico. Úsala si el usuario pide leer un fragmento en particular.",
                schema: z.object({
                    index: z.number().int().describe("El índice numérico del fragmento que se desea recuperar. Debe ser un número entero empezando desde 0."),
                }),
            }
        );


        const systemPrompt = `Eres un asistente virtual de la Universidad Politécnica de Valencia (UPV). Tu objetivo principal es ayudar a los alumnos a resolver dudas sobre el video o la clase que están viendo.
        
        Tienes a tu disposición tres herramientas:
        - 'search_in_class': Para buscar conceptos, temas o detalles dentro del contenido de la clase.
        - 'get_total_chunks': Para saber en cuántos fragmentos (chunks) está dividida la transcripción.
        - 'get_chunk_by_index': Para leer el texto exacto de un fragmento concreto.
        
        REGLAS ESTRICTAS:
        1. BÚSQUEDA DE CONTENIDO: Cuando el usuario pregunte sobre cualquier concepto, tema o detalle de la clase, DEBES usar la herramienta 'search_in_class'. 
        2. CERO ALUCINACIONES: NUNCA inventes información ni respondas basándote en tu conocimiento general si te preguntan sobre el contenido del video. Basa tu respuesta ÚNICAMENTE en la información devuelta por tus herramientas.
        3. MANEJO DE ERRORES: Si la herramienta de búsqueda devuelve "No se ha encontrado nada", o si un chunk está vacío, dile amablemente al usuario que ese tema no se menciona en el video actual o que el fragmento no contiene información.
        4. TONO: Responde de manera clara, concisa y en un tono académico y cercano.`;
        

        const model = new ChatOpenAI({
            apiKey: "dummy",
            modelName: "big-pickle",
            configuration: {
                baseURL: `${location.origin}/api/opencode/zen/v1`,
                // contextWindowSize: this.contextWindowSize
            },
        });

        const checkpointer = new MemorySaver();
        const agent = createAgent({
            model: model,
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

    async loadVectorStoreAndCreateAgent(progressCallback: LoadVectorStoteProgressCallback = async () => {}) {
        await this.loadVectorStore(progressCallback);
        this.agent = await this.createAgent();
    }
}
