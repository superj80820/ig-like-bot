import * as dotenv from 'dotenv';
import { chromium, Page } from 'playwright';
import express, { Express, Request, Response } from 'express';

dotenv.config();

const USER_EMAIL = process.env.USER_EMAIL ?? "";
const USER_PASSWORD = process.env.USER_PASSWORD ?? "";

let storyLikeCount = 0;
let postLikeCount = 0;

const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

const likeStory = async (page: Page) => {
  console.log("---like story: start---")
  await page.getByLabel(/Story by .+/i).first().click();
  let missStoryLikeButtonCount = 0;
  for (let i = 0; i < 10; i++) {
    if (missStoryLikeButtonCount >= 10) {
      missStoryLikeButtonCount = 0;
      console.log("---like story: done---")
      break;
    }
    await page.getByRole('button', { name: 'Like' }).
      first().
      click({ timeout: 5000 }).
      catch(() => {
        console.log("miss like button");
        missStoryLikeButtonCount++
      })
    await page.getByLabel('Next').first().click();
    console.log("click story like, now: ", storyLikeCount);
    storyLikeCount++;
    await page.waitForTimeout(1000 + getRandomInt(1000, 5000));
  }
}

const likePost = async (page: Page) => {
  console.log("---like post: start---")
  let missLikePostButtonCount = 0;
  for (let i = 0; i < 10; i++) {
    if (missLikePostButtonCount >= 10) {
      console.log("---like post: done---")
      break
    }
    await (async () => {
      for (const row of await page.getByRole('button', { name: 'Like' }).all()) {
        await row.
          click().
          catch(() => {
            console.log("miss like button");
            missLikePostButtonCount++
          });
        console.log("click post like, now: ", postLikeCount);
        postLikeCount++;
        await page.waitForTimeout(1000 + getRandomInt(1000, 5000));
      }
      await page.reload();
      await page.waitForTimeout(5000 + getRandomInt(1000, 5000));
    })();
  }
}

const likeProcess = async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  context.setDefaultTimeout(60000);
  const page = await context.newPage();

  await page.goto('https://www.instagram.com/');

  await page.locator('xpath=/html/body/div[2]/div/div/div[2]/div/div/div[1]/section/footer/div/div[2]/span/select').selectOption('en');

  await page.getByLabel('Phone number, username, or').click();
  await page.getByLabel('Phone number, username, or').fill(USER_EMAIL);
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill(USER_PASSWORD);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  try {
    await page.getByRole('button', { name: 'Not now' }).click();
  } catch (err) {
    console.log("miss Not now button")
  }
  try {
    await page.getByRole('button', { name: 'Not Now' }).click();
  } catch (err) {
    console.log("miss Not Now button")
  }

  while (true) {
    await page.goto('https://www.instagram.com/');

    if (storyLikeCount < 750) {
      await likeStory(page);
    }
    if (postLikeCount < 250) {
      await likePost(page);
    }
    if (storyLikeCount + postLikeCount === 1000) {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          resolve()
        }, 1000 * 60 * 60 * 6)
      })
    }

    await page.reload();
  }
}

(async () => {
  while (true) {
    try {
      await likeProcess();
    } catch (err) {
      console.log("restart like process because: ", err)
    }
  }
})();

const app: Express = express();
const port = process.env.PORT ?? 8080;

app.get('/information', (req: Request, res: Response) => {
  res.send({ "story_like_count": storyLikeCount, "post_like_count": postLikeCount });
});

app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});