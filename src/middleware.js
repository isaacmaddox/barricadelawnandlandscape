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
         if (!this.ips[req.url]) {
            console.log("Making map");
            this.ips[req.url] = new Map();
         }

         const map = this.ips[req.url];
         const ip = req.headers["x-nf-client-connection-ip"];

         if (ip === "::1") return next();

         if ((map.get(ip) ?? 0) < allowedRequests) {
            map.set(ip, (map.get(ip) ?? 0) + 1);

            setTimeout(() => {
               map.set(ip, (map.get(ip) ?? 0) - 1);
            }, rollingTime * 60 * 1000);

            return next();
         }

         res.status(429).json({
            status: "fail",
            message: "Too many requests. Please slow down",
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
            message: err.message
         })
      }

      res.status(500).json({
         status: "error",
         message: "Something went wrong",
         diagnostics: err
      });
   }
}