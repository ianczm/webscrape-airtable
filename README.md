# vc-webscrape-airtable

Test project as proof-of-concept for:

- Webscraping data from external sources
- Transforming data to preferred schema
- Storing data in internal database (airtable)
- [WIP] Exporting to excel

## Proof-of-Concept

- Data extracted from [Crunchbase](https://www.crunchbase.com/)
  - Tesla, Inc.
  - Scale AI, Inc.
  - Flipkart Internet Pvt Ltd.
  - Aisles
  - Volkswagen AG
  - Game7
  - Meesho Inc.
- View the transformed data [here](data/data.json)
- View the live Airtable [here](https://airtable.com/appVY2w8WTy9Bc4j8/shrBANbLah8Uxn7gG)


## Installation

[WIP]

### Airtable Client

Node.js is a pre-requisite.

```sh
cd client-airtable
npm install
```

### Scraper Service

Conda is a pre-requisite.

```sh
cd service-scraper
conda create -n vc-webscrape-airtable python=3.10
pip install -r requirements.txt
```
