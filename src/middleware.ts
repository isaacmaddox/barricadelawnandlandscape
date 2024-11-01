import { ErrorRequestHandler, NextFunction, Request, Response } from "express";

interface IpMap {
   count: number;
   timestamps: number[];
}

interface RouteMap {
   [key: string]: Map<string, IpMap>;
}

export class Middleware {
   ips: RouteMap = {};

   removePoweredBy(req: Request, res: Response, next: NextFunction) {
      res.setHeader("X-Powered-By", "");
      next();
   }

   rateLimit(allowedRequests: number, rollingTime: number) {
      return (req: Request, res: Response, next: NextFunction) => {
         const ip = (req.headers["x-nf-client-connection-ip"] as string) || (req.ip as string);

         // if (ip === "::1" || ip === "127.0.0.1") return next();

         if (!this.ips[req.url]) {
            this.ips[req.url] = new Map();
         }

         const map = this.ips[req.url];
         const now = Date.now();
         const requestData = map.get(ip) || { count: 0, timestamps: [] };

         requestData.timestamps = requestData.timestamps.filter(
            (timestamp) => now - timestamp < rollingTime * 60 * 1000
         );

         requestData.count = requestData.timestamps.length;

         if (requestData.count < allowedRequests) {
            requestData.timestamps.push(now);
            requestData.count++;
            map.set(ip, requestData);
            return next();
         }

         res.status(429).json({
            status: "fail",
            data: {
               message: "Too many requests. Please slow down",
               retryAfter: Math.ceil((requestData.timestamps[0] + rollingTime * 60 * 1000 - now) / 1000),
            },
         });
      };
   }

   errors: ErrorRequestHandler = (err, req, res, next) => {
      if (err instanceof Error) {
         res.status(500).json({
            status: "error",
            message: err.message,
         });
         return;
      }

      res.status(500).json({
         status: "error",
         message: "Something went wrong",
         diagnostics: err,
      });
   };
}
