import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import Scraper, {
  Product,
} from "./scrapers/books-to-scrape-v1/BooksToScrapeScraper.js";

type DBData = {
  products: Product[];
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

const main = async () => {
  const baseUrl = "https://books.toscrape.com/";
  const folder = "books.toscrape.com";

  const db = await connectToDb(`../../data/scraped/${folder}`);

  const scraper = new Scraper(baseUrl);
  await scraper.run(async (data) => {
    await db.data.products.push(...data);
  }, false);

  await db.write();
};

main();
