import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { BooksToScrapeScraper as Books } from "./scrapers/books-to-scrape-v1/BooksToScrapeScraper.js";

type DBData = {
  products: Books.Product[];
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
  const folder = "books.toscrape.com";
  const db = await connectToDb(`../../data/scraped/${folder}`);

  const scraper = new Books.Scraper();
  await scraper.run({
    dataCallback: async (data) => {
      await db.data.products.push(...data);
    },
    headless: false,
    pageLimit: 5,
  });

  await db.write();
};

main();
