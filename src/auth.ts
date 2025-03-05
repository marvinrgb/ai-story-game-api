import jwt from 'jsonwebtoken';
import { Router, Request, Response, NextFunction} from 'express';
import { auth } from 'express-oauth2-jwt-bearer';


const jwtCheck = auth({
  audience: process.env.AUTH_AUDIENCE || 'http://localhost:3000',
  issuerBaseURL: 'https://dev-marvinrgb.eu.auth0.com/'
});

export { jwtCheck, decodeJwtPayload };

function decodeJwtPayload(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const payloadJson = atob(payloadBase64);
  return JSON.parse(payloadJson);
}
