import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser } from "puppeteer";

const puppeteer = puppeteerExtra.default;
puppeteer.use(StealthPlugin());

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://google.com");
  await page.screenshot({ path: "screenshots/test.jpg" });

  await new Promise((r) => setTimeout(r, 5000));

  await browser.close();
};

main();
