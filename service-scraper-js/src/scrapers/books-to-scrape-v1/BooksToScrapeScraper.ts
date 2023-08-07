import BaseScraper from "../BaseScraper.js";

export namespace BooksToScrapeScraper {
  export type Product = {
    image: string;
    rating: number;
    title: string;
    price: number;
  };

  export class Scraper extends BaseScraper<Product[]> {
    constructor() {
      super("https://books.toscrape.com/");
    }

    protected async getTotalPages(): Promise<number> {
      return await this.page.$eval("ul.pager > .current", (pager) => {
        let regex = /\d* of (\d*)/;
        let text = pager.textContent;
        let pageNumberString = text!.match(regex)![1];
        return parseInt(pageNumberString);
      });
    }

    protected mapData(elements: Element[], baseUrl: string): Product[] {
      const utils = {
        mapStarRatings: (rating: string): number => {
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
        },
        mapPrice: (price: string): number => {
          let number = price.replace("£", "");
          return parseFloat(number);
        },
      };

      return elements
        .map((element) => ({
          image: element.querySelector(".thumbnail")!.getAttribute("src"),
          rating: element.querySelector(".star-rating")!.classList[1],
          title: element.querySelector("h3 a")!.getAttribute("title"),
          price: element.querySelector(".product_price .price_color")!
            .textContent,
        }))
        .map(({ image, rating, title, price }) => {
          return {
            image: baseUrl + image,
            rating: utils.mapStarRatings(rating),
            title: title!,
            price: utils.mapPrice(price!),
          };
        });
    }

    protected selector(): string {
      return ".product_pod";
    }

    protected navigateToNextPage(): Promise<any>[] {
      return [
        this.page.waitForNavigation({ waitUntil: "networkidle0" }),
        this.page.click("ul.pager > .next > a"),
      ];
    }
  }
}
