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

  // Get total pages (implementation needed to scrape from website)
  protected abstract getTotalPages(): Promise<number>;

  // Converts the retrieved elements into the data format, all data mappng logic
  // must be in this function (cannot call anything outside browser context basically)
  protected abstract mapData(elements: Element[], baseUrl: string): T;

  // Selector of the elements containing data to be retrieved
  protected abstract selector(): string;

  // Tell puppeteer how to navigate to next page
  protected abstract navigateToNextPage(): Promise<void>[];

  private async wait(time: number) {
    return new Promise((r) => setTimeout(r, time));
  }

  private async loadBaseUrl(headless: boolean) {
    this.browser = await this.puppeteer.launch({ headless });
    this.page = await this.browser.newPage();
    await this.page.goto(this.baseUrl, { waitUntil: "networkidle0" });
    this.totalPages = await this.getTotalPages();
  }

  private async getPageData(): Promise<T> {
    return await this.page.$$eval(this.selector(), this.mapData, this.baseUrl);
  }

  async run(options: {
    dataCallback: (data: T) => void;
    headless?: boolean;
    pageLimit?: number;
  }) {
    const { dataCallback, headless, pageLimit } = options;

    const limit = pageLimit ?? this.totalPages;
    await this.loadBaseUrl(headless ?? true);

    for (this.currentPage = 1; this.currentPage <= limit; this.currentPage++) {
      const data = await this.getPageData();
      dataCallback(data); // do something with the data

      if (this.currentPage !== limit) {
        await Promise.all(this.navigateToNextPage());
      }
    }

    await this.browser.close();
  }
}
