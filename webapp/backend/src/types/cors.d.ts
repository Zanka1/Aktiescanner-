import { RequestHandler } from "express";

declare namespace cors {
  interface CorsOptions {
    origin?: boolean | string | RegExp | (string | RegExp)[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  type CorsRequestHandler = RequestHandler;
}

declare function cors(options?: cors.CorsOptions): cors.CorsRequestHandler;

export = cors;
