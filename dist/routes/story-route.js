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
const express_1 = require("express");
const client_1 = require("@prisma/client");
const ai_handler_1 = require("../ai-handler");
const auth_1 = require("../auth");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
router.get("/public", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = new client_1.PrismaClient();
        const stories = yield db.story.findMany({
            where: {
                public: true
            },
            select: {
                id: true,
                title: true,
                snippets: true
            }
        });
        stories.forEach((story) => {
            story.teaser = story.snippets[0].text;
            delete story.snippets;
        });
        res.json(stories);
    }
    catch (error) {
        return next(error);
    }
}));
router.get('/', auth_1.jwtCheck, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // console.log(req.auth?.payload)
    // console.log(req.auth.token)
    const user_data = (yield axios_1.default.get("https://dev-marvinrgb.eu.auth0.com/userinfo", {
        headers: {
            Authorization: `Bearer ${(_a = req.auth) === null || _a === void 0 ? void 0 : _a.token}`
        }
    })).data;
    // console.log(user_data)
    try {
        const db = new client_1.PrismaClient();
        if (req.query.story_id) {
            const story_id = Number(req.query.story_id);
            const story = yield db.story.findFirst({
                where: {
                    id: story_id,
                    OR: [
                        {
                            user_mail: user_data === null || user_data === void 0 ? void 0 : user_data.email
                        },
                        {
                            public: true
                        }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    snippets: true,
                    user_mail: true
                }
            });
            console.log(user_data.email);
            console.log(story === null || story === void 0 ? void 0 : story.user_mail);
            if ((story === null || story === void 0 ? void 0 : story.user_mail) == user_data.email) {
                story.editable = true;
            }
            const options = yield db.option.findMany({
                where: {
                    snippet_id: story === null || story === void 0 ? void 0 : story.snippets[story.snippets.length - 1].id
                }
            });
            res.json({
                story,
                options
            });
        }
        else { //no story_id -> all stories
            const stories = yield db.story.findMany({
                where: {
                    user_mail: user_data === null || user_data === void 0 ? void 0 : user_data.email
                },
                select: {
                    title: true,
                    id: true
                }
            });
            res.json(stories);
        }
    }
    catch (error) {
        return next(error);
    }
}));
router.put("/", auth_1.jwtCheck, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const user_data = (yield axios_1.default.get("https://dev-marvinrgb.eu.auth0.com/userinfo", {
            headers: {
                Authorization: `Bearer ${(_b = req.auth) === null || _b === void 0 ? void 0 : _b.token}`
            }
        })).data;
        const data = yield (0, ai_handler_1.continueStory)(Number(req.query.story_id), Number(req.query.option_id), user_data.email);
        res.json(data);
    }
    catch (error) {
        return next(error);
    }
}));
router.post("/", auth_1.jwtCheck, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const user_data = (yield axios_1.default.get("https://dev-marvinrgb.eu.auth0.com/userinfo", {
            headers: {
                Authorization: `Bearer ${(_c = req.auth) === null || _c === void 0 ? void 0 : _c.token}`
            }
        })).data;
        // const db = new PrismaClient();
        const story_id = yield (0, ai_handler_1.createStory)(req.body.tags, req.body.topic, user_data === null || user_data === void 0 ? void 0 : user_data.email);
        res.status(201).json(story_id);
    }
    catch (error) {
        return next(error);
    }
}));
exports.default = router;
