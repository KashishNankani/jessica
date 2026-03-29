import { chromium } from "playwright";
import fs from "node:fs/promises";

const LIVE_URL = "https://voiceagent8bits.netlify.app/";
const LOCAL_URL = "http://127.0.0.1:5173/";

async function capture(url, prefix) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const outerHTML = await page.evaluate(() => document.documentElement.outerHTML);
  await fs.writeFile(`${prefix}.outerHTML.html`, outerHTML, "utf-8");

  await page.screenshot({ path: `${prefix}.full.png`, fullPage: true });

  const computed = await page.evaluate(() => {
    const pickByText = (needle) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const el = /** @type {HTMLElement} */ (walker.currentNode);
        if (el && el.textContent && el.textContent.trim() === needle) return el;
      }
      return null;
    };

    const keyEls = [];
    const push = (name, el) => {
      if (!el) return;
      const cs = getComputedStyle(el);
      keyEls.push({
        name,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        className: el.className || null,
        text: (el.textContent || "").trim().slice(0, 140),
        rect: el.getBoundingClientRect().toJSON?.() ?? (() => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left };
        })(),
        styles: {
          display: cs.display,
          position: cs.position,
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          color: cs.color,
          background: cs.background,
          backgroundColor: cs.backgroundColor,
          borderRadius: cs.borderRadius,
          border: cs.border,
          boxShadow: cs.boxShadow,
          backdropFilter: cs.backdropFilter,
          filter: cs.filter,
          width: cs.width,
          height: cs.height,
          padding: cs.padding,
          margin: cs.margin,
          gap: cs.gap,
          alignItems: cs.alignItems,
          justifyContent: cs.justifyContent,
        },
      });
    };

    push("body", document.body);
    push("#root", document.querySelector("#root"));
    push("H1 JESSICA AI", pickByText("JESSICA AI"));
    push("H2 JESSICA Intelligence", pickByText("JESSICA")?.closest("section,div,main") || null);
    push("Button INITIATE SESSION", pickByText("INITIATE SESSION")?.closest("button") || null);
    push("Button QUEUE CAMPAIGN", pickByText("QUEUE CAMPAIGN")?.closest("button") || null);
    push("Card CLINICAL DASHBOARD", pickByText("CLINICAL DASHBOARD")?.closest("div,section,main") || null);
    push("Card Intelligence Extract", pickByText("Intelligence Extract")?.closest("div,section") || null);
    push("Card Subjects Roster", pickByText("Subjects Roster")?.closest("div,section") || null);

    const fonts = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((n) => (n.tagName === "LINK" ? n.getAttribute("href") : "inline-style"))
      .filter(Boolean);

    return { url: location.href, fonts, keyEls };
  });

  await fs.writeFile(`${prefix}.computed.json`, JSON.stringify(computed, null, 2), "utf-8");
  await browser.close();
}

await capture(LIVE_URL, "live");
await capture(LOCAL_URL, "local");

console.log("Wrote live/local screenshots, outerHTML, computed styles.");
