import * as express from "express";
import { ParseJSONOrDefault } from "../common/Toolbox";
import { Res, Req } from "./routes";
import axios from "axios";
import { PlayerViewManager } from "./playerviewmanager";
import * as url from "url";
import * as net from "net";
import * as dns from "dns";
import { promisify } from "util";

const dnsLookup = promisify(dns.lookup);

const ALLOWED_HOSTS = (process.env.IMPORT_ALLOWED_HOSTS || "")
  .split(",")
  .map(h => h.trim().toLowerCase())
  .filter(Boolean);

const MAX_RESPONSE_SIZE = 1_000_000; // 1MB

function isPrivateIP(ip: string): boolean {
  if (
    net.isIPv4(ip) &&
    (ip.startsWith("10.") ||
      ip.startsWith("172.16.") ||
      ip.startsWith("172.17.") ||
      ip.startsWith("172.18.") ||
      ip.startsWith("172.19.") ||
      ip.startsWith("172.20.") ||
      ip.startsWith("172.21.") ||
      ip.startsWith("172.22.") ||
      ip.startsWith("172.23.") ||
      ip.startsWith("172.24.") ||
      ip.startsWith("172.25.") ||
      ip.startsWith("172.26.") ||
      ip.startsWith("172.27.") ||
      ip.startsWith("172.28.") ||
      ip.startsWith("172.29.") ||
      ip.startsWith("172.30.") ||
      ip.startsWith("172.31.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("127.") ||
      ip === "0.0.0.0" ||
      ip.startsWith("169.254."))
  ) {
    return true;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (
      lower === "::1" ||
      lower.startsWith("fe80:") ||
      lower.startsWith("fc") ||
      lower.startsWith("fd")
    ) {
      return true;
    }
  }
  return false;
}

async function validateUrl(rawUrl: string): Promise<void> {
  const parsed = new url.URL(rawUrl);

  if (parsed.protocol !== "https:") {
    throw new Error("Only https URLs are allowed.");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(hostname)) {
    throw new Error(
      "Host not in allowlist. Set IMPORT_ALLOWED_HOSTS to permit this domain."
    );
  }

  // Resolve hostname and check for private IPs
  const { address } = await dnsLookup(hostname);
  if (isPrivateIP(address)) {
    throw new Error("Requests to private/internal network addresses are not allowed.");
  }
}

export function configureImportRoutes(
  app: express.Application,
  playerViews: PlayerViewManager
) {
  const importEncounter = async (req, res: Res) => {
    const newViewId = await playerViews.InitializeNew();
    const session = req.session;

    if (typeof req.body.Combatants === "string") {
      session.postedEncounter = {
        Combatants: ParseJSONOrDefault(req.body.Combatants, [])
      };
    } else {
      session.postedEncounter = req.body;
    }

    res.redirect("/e/" + newViewId);
  };

  app.post("/launchencounter/", importEncounter);
  app.post("/importencounter/", importEncounter);

  app.get("/encounterfrom/", async (req: Req, res: Res) => {
    const session = req.session!;
    if (typeof req.query.url !== "string") {
      return res.status(400).send("Missing url parameter.");
    }

    const targetUrl = req.query.url;

    try {
      await validateUrl(targetUrl);
    } catch (err) {
      return res.status(400).send("Invalid URL: " + (err as Error).message);
    }

    try {
      const response = await axios.get(targetUrl, {
        timeout: 10_000,
        maxRedirects: 3,
        maxContentLength: MAX_RESPONSE_SIZE,
        responseType: "text"
      });

      const body =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);

      if (body.length > MAX_RESPONSE_SIZE) {
        return res.status(400).send("Encounter JSON too large.");
      }

      const json = typeof response.data === "object"
        ? response.data
        : JSON.parse(body);

      if (typeof json.Combatants === "object" && json.Combatants.length > 0) {
        session.postedEncounter = {
          Combatants: json.Combatants
        };
        const newEncounterViewId = await playerViews.InitializeNew();
        res.redirect("/e/" + newEncounterViewId);
      } else {
        return res.status(400).send("Invalid JSON: Missing Combatants.");
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        return res
          .status(400)
          .send("Error fetching URL: " + (e.message || "Request failed"));
      }
      return res.status(400).send("Invalid JSON; could not parse: " + e);
    }
  });

  app.get("/sampleencounter/", async (req: Req, res: Res) => {
    return res.send({
      Combatants: [
        { Name: "Nemo", HP: { Value: 10 } },
        { Name: "Fat Goblin", HP: { Value: 20 }, Id: "mm.goblin" },
        { Id: "mm.goblin" }
      ]
    });
  });
}
