const puppeteer = require("puppeteer"); // eslint-disable-line
const fs = require("fs");
const path = require("path");

const DEBUG = process.env.DEBUG || false;
const MAX_VIDEOS = process.env.TOTAL_NUM || 500;

const usernames = ["hallofmeat", "kookslams"];
const baseURL = "http://instagram.com/";

async function startCarousel(page) {
  const image = await page.$(`article img`);
  await image.click();
}

async function nextVideo(page) {
  await page.waitFor(80);
  const nextButton = await page.$("a.coreSpriteRightPaginationArrow");
  if (!nextButton) return false;
  try {
    await nextButton.click();
  } catch (e) {
    console.error("CLICKING VIDEO", e);
  }
  return true;
}

async function getAllVideoSources(page, urls = new Set()) {
  try {
    const videoElem = await page.waitFor("video", { timeout: 1200 });
    if (videoElem) {
      const src = await page.evaluate(vid => vid.src, videoElem);
      urls.add(src);
    }
  } catch (e) {
    console.error("Video wasn't found on the page");
  }
  const morePages = await nextVideo(page);
  if (!morePages || urls.size >= MAX_VIDEOS) return urls;
  return getAllVideoSources(page, urls);
}

async function loadURL(page, url) {
  return page.goto(url);
}

async function startScraping(browser, url) {
  const page = await browser.newPage();
  await loadURL(page, url);
  await startCarousel(page);
  const urls = await getAllVideoSources(page);
  return urls;
}

function identifyBaseURL(strOne, strTwo) {
  let str = "";
  for (let i = 0; i < strOne.length; i += 1) {
    if (strOne[i] === strTwo[i]) {
      str += strOne[i];
    } else {
      return str;
    }
  }
  return str;
}

function shuffle(arr) {
  let currIndex = arr.length;
  let tempValue;
  let randomIndex;
  while (currIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currIndex);
    currIndex -= 1;
    tempValue = arr[currIndex];
    arr[currIndex] = arr[randomIndex];
    arr[randomIndex] = tempValue;
  }
  return arr;
}

async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: !DEBUG,
    devtools: !DEBUG
  });
  const urlsToBeScraped = usernames
    .map(u => `${baseURL}${u}`)
    .map(url => startScraping(browser, url));
  Promise.all(urlsToBeScraped).then(urls => {
    const flattenedURLs = shuffle(
      urls.reduce((total, curr) => [...total, ...curr], [])
    );
    const url = identifyBaseURL(flattenedURLs[0], flattenedURLs[1]);
    const objToWrite = {
      url,
      data: flattenedURLs.map(link => link.replace(url, ""))
    };
    const json = JSON.stringify(objToWrite);
    fs.writeFile(
      path.resolve(__dirname, "../app/data/video_urls.json"),
      json,
      async err => {
        if (err) throw err;
        console.log("All done!");
        await browser.close();
      }
    );
  });
}

launchBrowser();
