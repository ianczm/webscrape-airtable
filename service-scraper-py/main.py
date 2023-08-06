from bs4 import BeautifulSoup
import requests
import json
import os

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
}

BASE_URL = 'https://www.crunchbase.com/organization'

KEY_COLUMN_MAP = {
    'Investments': 'Investments',
    'Total Funding Amount': 'Total Funding Amount'
}

COMPANIES = [
    'tesla-motors',
    'scale-2',
    'flipkart',
    'aisles',
    'volkswagen-group',
    'game7',
    'meesho'
]


def obtainPageSoup(url: str, debug=False):
    page = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(page.content, 'html.parser')

    if debug:
        with open('../data/debug_soup.json', 'w') as f:
            json.dump(soup.__str__(), f, indent=2)

    return soup


def obtainData(soup: BeautifulSoup, debug=False):
    state = soup.select_one('#ng-state')
    jsonObj = json.loads(state.text)
    data = list(jsonObj['HttpState'].values())[0]['data']

    if debug:
        with open('../data/debug_soupdata.json', 'w') as f:
            json.dump(data, f, indent=2)

    return data


def transformDataToRecord(data, debug=False):
    record = {
        'Name': getLegalName(data),
        'Investments': getNumInvestments(data),
        'Total Funding Amount': getTotalFundingAmount(data)
    }

    if debug:
        with open('../data/debug_record.json', 'w') as f:
            json.dump(record, f, indent=2)

    return record


def getLegalName(data):
    try:
        return data['cards']['overview_fields_extended']['legal_name']
    except KeyError:
        return data['properties']['identifier']['value']


def getNumInvestments(data):
    try:
        return data['cards']['investments_summary']['num_investments']
    except KeyError:
        return 0


def getTotalFundingAmount(data):
    return data['cards']['recommended_search'][0]['org_funding_total']['value_usd']


def scrapeCompanyRecord(company_permalink: str, debug=False):
    soup = obtainPageSoup(BASE_URL + '/' + company_permalink, debug=debug)
    data = obtainData(soup, debug=debug)
    record = transformDataToRecord(data, debug=debug)
    return record


def appendToJson(record):
    records = []

    if os.path.exists('../data/data.json'):
        with open('../data/data.json') as f:
            records = json.load(f)

    records.append(record)

    with open('../data/data.json', 'w') as f:
        json.dump(records, f, indent=2)


def main(debug=False):
    records = []
    if os.path.exists('../data/data.json'):
        os.remove('../data/data.json')
    for company_permalink in COMPANIES:
        record = scrapeCompanyRecord(company_permalink, debug)
        records.append(record)
        appendToJson(record)
        print(f'Processed company: {record["Name"]}')


if __name__ == "__main__":
    main(debug=True)
