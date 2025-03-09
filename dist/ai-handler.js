"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoryStarterSuggestions = getStoryStarterSuggestions;
exports.createStory = createStory;
exports.continueStory = continueStory;
const generative_ai_1 = require("@google/generative-ai");
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// export async function test() {
//   // createStory()
//   continueStory(2, 4)
// }
function getStoryStarterSuggestions() {
    return __awaiter(this, void 0, void 0, function* () {
        let prompt = fs_1.default.readFileSync("./src/prompts/storySuggestions.txt", "utf-8");
        const result = yield textModel.generateContent(prompt);
        // let text = result.response.text();
        // text = text.replace("```json", "");
        // text = text.replace("```", "");
        return result.response.text();
    });
}
function createStory() {
    return __awaiter(this, arguments, void 0, function* (tags = ["exiting", "interesting"], topic = "default", user_mail) {
        const db = new client_1.PrismaClient();
        console.log(user_mail);
        let prompt = fs_1.default.readFileSync("./src/prompts/createStory.txt", "utf-8");
        prompt = prompt.replace("--tags--", JSON.stringify(tags));
        prompt = prompt.replace("--topic--", topic);
        const result = yield textModel.generateContent(prompt);
        let text = result.response.text();
        text = text.replace("```json", "");
        text = text.replace("```", "");
        const storyData = JSON.parse(text);
        const story = yield db.story.create({
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
        const snippet = yield db.snippet.create({
            data: {
                index: story.snippets.length,
                text: storyData.story,
                story_id: story.id
            }
        });
        for (let i = 0; i < storyData.options.length; i++) {
            yield db.option.create({
                data: {
                    index: i,
                    text: storyData.options[i],
                    snippet_id: snippet.id
                }
            });
        }
        return story.id;
    });
}
function continueStory(story_id, option_id, user_mail) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = new client_1.PrismaClient();
        if (user_mail) {
            const story_test = yield db.story.findMany({
                where: {
                    id: story_id,
                    user_mail: user_mail
                }
            });
            if (story_test.length == 0) {
                throw new Error("no permission for this story");
            }
        }
        const story = yield db.story.findFirst({
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
        let oldStoryText = "";
        story === null || story === void 0 ? void 0 : story.snippets.forEach((snippet) => {
            oldStoryText += " ";
            oldStoryText += snippet.text;
        });
        const option = yield db.option.findFirst({
            where: {
                id: option_id
            }
        });
        if (!option) {
            throw Error("selected option not found");
        }
        let prompt = fs_1.default.readFileSync("./src/prompts/continueStory.txt", "utf-8");
        prompt = prompt.replace("--story--", oldStoryText);
        prompt = prompt.replace("--option--", (option === null || option === void 0 ? void 0 : option.text) || "");
        const result = yield textModel.generateContent(prompt);
        let text = result.response.text();
        text = text.replace("```json", "");
        text = text.replace("```", "");
        const storyData = JSON.parse(text);
        const newSnippet = yield db.snippet.create({
            data: {
                index: (story === null || story === void 0 ? void 0 : story.snippets.length) || 0,
                text: storyData.newStorySnippet,
                story_id: story_id
            }
        });
        for (let i = 0; i < storyData.options.length; i++) {
            yield db.option.create({
                data: {
                    index: i,
                    text: storyData.options[i],
                    snippet_id: newSnippet.id
                }
            });
        }
        return storyData;
    });
}
