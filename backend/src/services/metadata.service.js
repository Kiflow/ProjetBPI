const http = require("http");
const https = require("https");

const MAX_REDIRECTS = 5;
const MAX_BYTES = 1024 * 1024;

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const requestUrl = (url, redirectCount = 0) =>
  new Promise((resolve, reject) => {
    if (!isHttpUrl(url)) {
      reject(new Error("URL invalide."));
      return;
    }

    const client = url.startsWith("https") ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          "User-Agent": "BPI-Metadata/1.0",
          Accept: "text/html,application/xhtml+xml"
        },
        timeout: 8000
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = res.headers.location;

        if (status >= 300 && status < 400 && location) {
          if (redirectCount >= MAX_REDIRECTS) {
            res.resume();
            reject(new Error("Trop de redirections."));
            return;
          }
          const nextUrl = new URL(location, url).toString();
          res.resume();
          resolve(requestUrl(nextUrl, redirectCount + 1));
          return;
        }

        const contentType = String(res.headers["content-type"] || "");
        if (!contentType.includes("text/html")) {
          res.resume();
          resolve("");
          return;
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
          if (data.length > MAX_BYTES) {
            res.destroy();
            resolve(data);
          }
        });
        res.on("end", () => resolve(data));
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Timeout"));
    });
    req.on("error", (err) => reject(err));
  });

const extractTitle = (html) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!match) return "";
  return match[1].trim();
};

exports.fetchTitleForUrl = async (url) => {
  const html = await requestUrl(url);
  if (!html) return "";
  return extractTitle(html);
};
