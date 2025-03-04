import { Router, Request, Response, NextFunction} from 'express';
import { PrismaClient } from '@prisma/client';
import { continueStory, createStory } from '../ai-handler';
import { jwtCheck, decodeJwtPayload } from '../auth';
import axios from "axios";
const router = Router();

router.get("/public", async (req:Request, res:Response, next:NextFunction) => {
  try {
    const db = new PrismaClient();
    const stories: Array<any>  = await db.story.findMany({
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
  } catch (error: unknown) {
    return next(error);
  }
})

router.get('/', jwtCheck, async (req:Request, res:Response, next:NextFunction) => {
  // console.log(req.auth?.payload)
  // console.log(req.auth.token)
  const user_data = (await axios.get("https://dev-marvinrgb.eu.auth0.com/userinfo", {
    headers: {
      Authorization: `Bearer ${req.auth.token}`
    }
  })).data
  // console.log(user_data)
  try {
    const db = new PrismaClient();
    if (req.query.story_id) {
      const story_id = Number(req.query.story_id);
      const story  = await db.story.findFirst({
        where: {
          id: story_id,
          OR: [
            {
              user_mail: user_data?.email
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
      console.log(user_data.email)
      console.log(story?.user_mail)
      if (story?.user_mail == user_data.email) {
        story.editable = true;
      }
      const options = await db.option.findMany({
        where: {
          snippet_id: story?.snippets[story.snippets.length-1].id
        }
      })
      res.json({
        story,
        options
      });
    } else { //no story_id -> all stories
      const stories = await db.story.findMany({
        where: {
          user_mail: user_data?.email
        },
        select: {
          title: true,
          id: true
        }
      });
      res.json(stories);
    }
  } catch (error: unknown) {
    return next(error);
  }
})

router.put("/", jwtCheck, async (req:Request, res:Response, next:NextFunction) => {
  try {
    
    const user_data = (await axios.get("https://dev-marvinrgb.eu.auth0.com/userinfo", {
      headers: {
        Authorization: `Bearer ${req.auth.token}`
      }
    })).data
    const data = await continueStory(Number(req.query.story_id), Number(req.query.option_id), user_data.email);
    res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.post("/", jwtCheck, async (req:Request, res:Response, next:NextFunction) => {
  try {
    
    const user_data = (await axios.get("https://dev-marvinrgb.eu.auth0.com/userinfo", {
      headers: {
        Authorization: `Bearer ${req.auth.token}`
      }
    })).data
    // const db = new PrismaClient();
    const story_id = await createStory(req.body.tags, req.body.topic, user_data?.email);
    res.status(201).json(story_id);
  } catch (error) {
    return next(error);
  }
})

export default router;