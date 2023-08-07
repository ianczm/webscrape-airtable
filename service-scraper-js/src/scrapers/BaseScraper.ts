import puppeteerExtra, { PuppeteerExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";

export default abstract class BaseScraper<T> {
  protected baseUrl: string;
  protected puppeteer: PuppeteerExtra;
  protected browser: Browser;
  protected page: Page;
  totalPages: number;
  currentPage: number;

  constructor(baseUrl: string) {
    this.puppeteer = puppeteerExtra.default;
    this.puppeteer.use(StealthPlugin());
    this.baseUrl = baseUrl;
  }

  /** Get total pages (implementation needed to scrape from website) */
  protected abstract getTotalPages(): Promise<number>;

  /** Converts the retrieved elements into the data format, all data
   * mappng logic must be in this function (cannot call anything outside
   * browser context basically) */
  protected abstract mapData(elements: Element[], baseUrl: string): T;

  /** Selector of the elements containing data to be retrieved */
  protected abstract selector(): string;

  /** Tell puppeteer how to navigate to next page */
  protected abstract navigateToNextPage(): Promise<void>[];

  /** Do not load any images */
  private async limitImageRequests() {
    await this.page.setRequestInterception(true);
    this.page.on("request", async (request) => {
      if (request.resourceType() == "image") {
        await request.abort();
      } else {
        await request.continue();
      }
    });
  }

  /** Make puppeteer wait for x milliseconds */
  private async wait(time: number) {
    if (time && time > 0) {
      return new Promise((r) => setTimeout(r, time));
    }
  }

  /** Set up puppeteer browser and page */
  private async launch(options: {
    headless: boolean;
    limitImageRequests: boolean;
  }) {
    const { headless, limitImageRequests } = options;

    this.browser = await this.puppeteer.launch({ headless });
    this.page = await this.browser.newPage();

    // page setup logic here
    if (limitImageRequests) await this.limitImageRequests();

    // page navigation logic here
    await this.page.goto(this.baseUrl, { waitUntil: "networkidle0" });

    // finally, parse the page for total number of pages
    this.totalPages = await this.getTotalPages();
  }

  /** Evaluate page and get back a list of data matching the type T */
  private async getPageData(): Promise<T> {
    return await this.page.$$eval(this.selector(), this.mapData, this.baseUrl);
  }

  /** Execute the scraper and get back data matching the type T */
  async run(options: {
    dataCallback: (data: T) => void;
    headless?: boolean;
    pageLimit?: number;
    pageDelay?: number;
    limitImageRequests?: boolean;
  }) {
    const { dataCallback, headless, pageLimit, pageDelay, limitImageRequests } =
      options;

    const limit = pageLimit ?? this.totalPages;

    await this.launch({
      headless: headless ?? true,
      limitImageRequests: limitImageRequests ?? true,
    });

    // Process each page
    for (this.currentPage = 1; this.currentPage <= limit; this.currentPage++) {
      const data = await this.getPageData();
      dataCallback(data); // do something with the data
      await this.wait(pageDelay);

      if (this.currentPage !== limit) {
        await Promise.all(this.navigateToNextPage());
      }
    }

    await this.browser.close();
  }
}
