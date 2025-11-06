import { RequestHandler } from "express";

declare namespace multer {
  interface MulterOptions {
    dest?: string;
    storage?: any;
    limits?: Record<string, any>;
  }

  interface Multer {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    any(): RequestHandler;
  }
}

declare function multer(options?: multer.MulterOptions): multer.Multer;

export = multer;
