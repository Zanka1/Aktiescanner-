import { IncomingMessage, ServerResponse } from "http";

declare namespace express {
  interface Request<P = any, ResBody = any, ReqBody = any, ReqQuery = any> extends IncomingMessage {
    params: P;
    body: ReqBody;
    query: ReqQuery;
    file?: any;
    files?: any;
  }

  interface Response<ResBody = any> extends ServerResponse {
    json: (body: ResBody) => Response<ResBody>;
    status: (code: number) => Response<ResBody>;
    send: (body?: any) => Response<ResBody>;
  }

  type NextFunction = (err?: any) => void;
  type RequestHandler = (req: Request, res: Response, next: NextFunction) => any;

  interface Express {
    use: (...handlers: any[]) => Express;
    get: (path: string, ...handlers: RequestHandler[]) => Express;
    post: (path: string, ...handlers: RequestHandler[]) => Express;
    listen: (port: number | string, callback?: () => void) => any;
  }
}

declare function express(): express.Express;

export = express;
export as namespace express;
