/**
 * @typedef {import("express").Handler} Handler
 * @typedef {import("express").ErrorRequestHandler} ErrorHandler
 */

export class Middleware {
   /**
    * @type {{ [key: string]: Map<string, number> }}
    */
   ips = {};

   /**
    * Remove the `X-Powered-By` header from responses
    * to avoid exposing the backend service to attackers
    *
    * @type {Handler}
    */
   removePoweredBy(req, res, next) {
      res.setHeader("X-Powered-By", null);
      next();
   }

   /**
    * Implement rate limiting on a specific route
    *
    * @type {(allowedRequests: number, rollingTime: number) => Handler,}
    * @param allowedRequests The number of legal requests for the rate limit
    * @param rollingTime The time, in minutes, for the rolling period
    */
   rateLimit(allowedRequests, rollingTime) {
      return (req, res, next) => {
         const ip = req.headers["x-nf-client-connection-ip"] || req.ip;

         if (ip === "::1" || ip === "127.0.0.1") return next();

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

   /**
    * Handle errors with the app
    *
    * @type {ErrorHandler}
    */
   errors(err, req, res, next) {
      if (err instanceof Error) {
         return res.status(500).json({
            status: "error",
            message: err.message,
         });
      }

      res.status(500).json({
         status: "error",
         message: "Something went wrong",
         diagnostics: err,
      });
   }
}
