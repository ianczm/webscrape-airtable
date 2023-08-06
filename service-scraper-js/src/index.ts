import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Page } from "puppeteer";

const puppeteer = puppeteerExtra.default;
puppeteer.use(StealthPlugin());

type Product = {
  image: string;
  rating: number;
  title: string;
  price: number;
};

type DBData = {
  products: Product[];
};

const wait = (time: number): Promise<void> => {
  return new Promise((r) => setTimeout(r, time));
};

const connectToDb = async (folderpath: string) => {
  // Create file
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filename = folderpath + "/" + `data-${Date.now()}.json`;
  const file = join(__dirname, filename);
  // Read db
  const adapter = new JSONFile<DBData>(file);
  const defaultData: DBData = { products: [] };
  const db = new Low<DBData>(adapter, defaultData);
  await db.read();
  return db;
};

const mapStarRatings = (rating: string): number => {
  switch (rating) {
    case "One":
      return 1;
    case "Two":
      return 2;
    case "Three":
      return 3;
    case "Four":
      return 4;
    case "Five":
      return 5;
    default:
      return 0;
  }
};

const mapPrice = (price: string): number => {
  let number = price.replace("£", "");
  return parseFloat(number);
};

const getProductsForCurrentPage = async (baseUrl: string, page: Page) => {
  let scrapedData = await page.$$eval(".product_pod", (products) =>
    products.map((product) => ({
      image: product.querySelector(".thumbnail").getAttribute("src"),
      rating: product.querySelector(".star-rating").classList[1],
      title: product.querySelector("h3 a").getAttribute("title"),
      price: product.querySelector(".product_price .price_color").textContent,
    }))
  );

  let productData: Product[] = scrapedData.map(
    ({ image, rating, title, price }) => ({
      image: baseUrl + image,
      rating: mapStarRatings(rating),
      title,
      price: mapPrice(price),
    })
  );

  return productData;
};

const main = async () => {
  const baseUrl = "https://books.toscrape.com/";
  const folder = "books.toscrape.com";

  const db = await connectToDb(`../../data/scraped/${folder}`);

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(baseUrl);

  const totalPages = await page.$eval("ul.pager > .current", (pager) => {
    let regex = /\d* of (\d*)/;
    let text = pager.textContent;
    let pageNumberString = text.match(regex)[1];
    return parseInt(pageNumberString);
  });

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const productData = await getProductsForCurrentPage(baseUrl, page);
    await db.data.products.push(...productData);
    if (currentPage !== totalPages) {
      await Promise.all([
        page.waitForNavigation(),
        page.click("ul.pager > .next > a"),
      ]);
    }
  }

  await browser.close();

  await db.write();
};

main();
