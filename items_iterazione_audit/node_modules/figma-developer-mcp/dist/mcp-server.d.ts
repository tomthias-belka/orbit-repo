import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetFileResponse, GetFileNodesResponse } from '@figma/rest-api-spec';

type ImageProcessingResult = {
    filePath: string;
    originalDimensions: {
        width: number;
        height: number;
    };
    finalDimensions: {
        width: number;
        height: number;
    };
    wasCropped: boolean;
    cropRegion?: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    cssVariables?: string;
    processingLog: string[];
};

type FigmaAuthOptions = {
    figmaApiKey: string;
    figmaOAuthToken: string;
    useOAuth: boolean;
};
type SvgOptions = {
    outlineText: boolean;
    includeId: boolean;
    simplifyStroke: boolean;
};
declare class FigmaService {
    private readonly apiKey;
    private readonly oauthToken;
    private readonly useOAuth;
    private readonly baseUrl;
    constructor({ figmaApiKey, figmaOAuthToken, useOAuth }: FigmaAuthOptions);
    private getAuthHeaders;
    private filterValidImages;
    private request;
    private buildSvgQueryParams;
    getImageFillUrls(fileKey: string): Promise<Record<string, string>>;
    getNodeRenderUrls(fileKey: string, nodeIds: string[], format: "png" | "svg", options?: {
        pngScale?: number;
        svgOptions?: SvgOptions;
    }): Promise<Record<string, string>>;
    downloadImages(fileKey: string, localPath: string, items: Array<{
        imageRef?: string;
        nodeId?: string;
        fileName: string;
        needsCropping?: boolean;
        cropTransform?: any;
        requiresImageDimensions?: boolean;
    }>, options?: {
        pngScale?: number;
        svgOptions?: SvgOptions;
    }): Promise<ImageProcessingResult[]>;
    getRawFile(fileKey: string, depth?: number | null): Promise<GetFileResponse>;
    getRawNode(fileKey: string, nodeId: string, depth?: number | null): Promise<GetFileNodesResponse>;
}

type CreateServerOptions = {
    isHTTP?: boolean;
    outputFormat?: "yaml" | "json";
    skipImageDownloads?: boolean;
};
declare function createServer(authOptions: FigmaAuthOptions, { isHTTP, outputFormat, skipImageDownloads }?: CreateServerOptions): McpServer;

interface ServerConfig {
    auth: FigmaAuthOptions;
    port: number;
    outputFormat: "yaml" | "json";
    skipImageDownloads?: boolean;
    configSources: {
        figmaApiKey: "cli" | "env";
        figmaOAuthToken: "cli" | "env" | "none";
        port: "cli" | "env" | "default";
        outputFormat: "cli" | "env" | "default";
        envFile: "cli" | "default";
        skipImageDownloads?: "cli" | "env" | "default";
    };
}
declare function getServerConfig(isStdioMode: boolean): ServerConfig;

declare function startServer(): Promise<void>;
declare function startHttpServer(port: number, mcpServer: McpServer): Promise<void>;
declare function stopHttpServer(): Promise<void>;

export { FigmaService, createServer, getServerConfig, startHttpServer, startServer, stopHttpServer };
