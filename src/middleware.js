/**
 * @typedef {import("express").Handler} Handler
 * @typedef {{
 *    ips: { [key: string]: Map<string, number> },
 *    removePoweredBy: Handler,
 *    rateLimit: (allowedRequests: number, rollingTime: number) => Handler
 * }} Middleware
 */

/**
 * @type {Middleware}
 */
export const middleware = {
   ips: {},

   /**
    * Remove the `X-Powered-By` header from responses
    * to avoid exposing the backend service to attackers
    */
   removePoweredBy(req, res, next) {
      res.setHeader("X-Powered-By", null);
      next();
   },

   /**
    * Implement rate limiting on a specific route
    *
    * @param allowedRequests The number of legal requests for the rate limit
    * @param rollingTime The time, in minutes, for the rolling period
    */
   rateLimit(allowedRequests, rollingTime) {
      return (req, res, next) => {
         if (!this.ips[req.url]) {
            this.ips[req.url] = new Map();
         }

         const map = this.ips[req.url];
         const ip = req.headers["x-nf-client-connection-ip"];

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
   },
};
