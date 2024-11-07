import csurf from "csurf";
import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";

interface IpMap {
   count: number;
   timestamps: number[];
   notFoundCount: number;
}

interface RouteMap {
   [key: string]: Map<string, IpMap>;
}

export class Middleware {
   private ips: RouteMap = {};
   private blackListedIps = new Set([
      "35.203.183.186",
      "93.183.89.165",
      "78.31.204.151",
      "207.228.13.25",
      "80.85.246.140",
      "128.199.229.13",
      "80.85.245.187",
      "212.34.154.231",
      "80.85.247.231",
      "195.2.78.89",
      "77.238.225.41",
   ]);

   csrf: RequestHandler = csurf({ cookie: true });

   removePoweredBy: RequestHandler = (req, res, next) => {
      res.setHeader("X-Powered-By", "");
      next();
   };

   rateLimit(allowedRequests: number, rollingTime: number) {
      return (req: Request, res: Response, next: NextFunction) => {
         const ip = (req.headers["x-nf-client-connection-ip"] as string) || (req.ip as string);

         if (!this.ips[req.url]) {
            this.ips[req.url] = new Map();
         }

         const map = this.ips[req.url];
         const now = Date.now();
         const requestData = map.get(ip) || { count: 0, timestamps: [], notFoundCount: 0 };

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
      const ip = (req.headers["x-nf-client-connection-ip"] as string) || (req.ip as string);
      const map = this.ips[req.url];

      if (map) {
         // If an error occurred during the request that was handed to this middleware,
         // then it should not count against the rate limit.

         const requestData = map.get(ip) || { count: 0, timestamps: [], notFoundCount: 0 };
         requestData.timestamps.pop();
         requestData.count = requestData.timestamps.length;
         map.set(ip, requestData);
      }

      console.error(err.message);

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

   notFound: RequestHandler = (req, res, next) => {
      res.status(404).format({
         html: () => res.send("<h1>Not Found</h1>"),
         json: () => res.json({ status: "error", message: "Couldn't find that resource" }),
      });
   };

   blackList: RequestHandler = (req, res, next) => {
      const ip = (req.headers["x-nf-client-connection-ip"] as string) || (req.ip as string);

      if (this.blackListedIps.has(ip)) {
         res.status(403).json({ status: "error", message: "Forbidden" });
         return;
      }

      next();
   };

   addToBlacklist(ip: string) {
      this.blackListedIps.add(ip);
   }
}
