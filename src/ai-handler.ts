import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from '@prisma/client';
import fs from "fs";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// export async function test() {
//   // createStory()
//   continueStory(2, 4)
// }

export async function getStoryStarterSuggestions(): Promise<string> {
  let prompt: string = fs.readFileSync("./src/prompts/storySuggestions.txt", "utf-8")
  
  const result = await textModel.generateContent(prompt);
  // let text = result.response.text();
  // text = text.replace("```json", "");
  // text = text.replace("```", "");

  return result.response.text();
}

export async function createStory(tags: Array<string> = ["exiting", "interesting"], topic: string = "default", user_mail?:string) {
  const db = new PrismaClient();
  console.log(user_mail)
  let prompt: string = fs.readFileSync("./src/prompts/createStory.txt", "utf-8")
  prompt = prompt.replace("--tags--", JSON.stringify(tags));
  prompt = prompt.replace("--topic--", topic);

  const result = await textModel.generateContent(prompt);
  let text = result.response.text();
  text = text.replace("```json", "");
  text = text.replace("```", "");
  const storyData: {title:string,story:string,options:Array<string>} = JSON.parse(text);
  const story = await db.story.create({
    data: {
      title: storyData.title,
      user_mail: user_mail
    },
    select: {
      id: true,
      snippets: {
        select: {
          _count: true
        }
      }
    }
  });
  const snippet = await db.snippet.create({
    data: {
      index: story.snippets.length,
      text: storyData.story,
      story_id: story.id
    }
  });
  for (let i = 0; i < storyData.options.length; i++) {
    await db.option.create({
      data: {
        index: i,
        text: storyData.options[i],
        snippet_id: snippet.id
      }
    })
  }
  return story.id;
}

export async function continueStory(story_id: number, option_id: number, user_mail?: string) {
  const db = new PrismaClient();
  if (user_mail) {
    const story_test = await db.story.findMany({
      where: {
        id: story_id,
        user_mail: user_mail
      }
    });
    if (story_test.length == 0) {
      throw new Error("no permission for this story")
    }
  }
  const story = await db.story.findFirst({
    where: {
      id: story_id
    },
    select: {
      id: true,
      snippets: {
        select: {
          text: true
        }
      }
    }
  });
  let oldStoryText: string = "";
  story?.snippets.forEach((snippet) => {
    oldStoryText += " ";
    oldStoryText += snippet.text;
  });

  const option = await db.option.findFirst({
    where: {
      id: option_id
    }
  });
  if (!option) {
    throw Error("selected option not found")
  }
  let prompt: string = fs.readFileSync("./src/prompts/continueStory.txt", "utf-8")
  prompt = prompt.replace("--story--", oldStoryText);
  prompt = prompt.replace("--option--", option?.text || "");

  const result = await textModel.generateContent(prompt);
  let text = result.response.text();
  text = text.replace("```json", "");
  text = text.replace("```", "");
  const storyData: {newStorySnippet:string,options:Array<string>} = JSON.parse(text);
  const newSnippet = await db.snippet.create({
    data: {
      index: story?.snippets.length || 0,
      text: storyData.newStorySnippet,
      story_id: story_id
    }
  });
  for (let i = 0; i < storyData.options.length; i++) {
    await db.option.create({
      data: {
        index: i,
        text: storyData.options[i],
        snippet_id: newSnippet.id
      }
    });
  }
  return storyData;
}