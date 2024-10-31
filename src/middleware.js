/**
 * @typedef {import("express").Handler} Handler
 */

export const middleware = {
   /**
    * @type {{ [key: string]: Map<string, number>}} An object of maps for rate limiting
    */
   ips: {},

   /**
    * Remove the `X-Powered-By` header from responses
    * to avoid exposing the backend service to attackers
    *
    * @type {Handler}
    */
   removePoweredBy(req, res, next) {
      res.setHeader("X-Powered-By", null);
      next();
   },

   /**
    * Implement rate limiting on a specific route
    *
    * @param {number} allowedRequests The number of legal requests for the rate limit
    * @param {number} rollingTime The time, in minutes, for the rolling period
    * @returns {Handler}
    */
   rateLimit(allowedRequests, rollingTime) {
      return (req, res, next) => {
         if (!this.ips[req.url]) {
            this.ips[req.url] = new Map();
         }

         const map = this.ips[req.url];
         const ip = req.headers["x-nf-client-connection-ip"];

         if ((map.get(ip) ?? 0) <= allowedRequests) {
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
