import dotenv from "dotenv";
import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import cors from "cors";
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import axios from 'axios';
import jwt from 'jsonwebtoken';
import serviceAccount from "./firebaseAdmin.json" assert { type: "json" };
import notificationRouter from "./routers/sendNotification.js";
import giftRouter from "./routers/sendGift.js";
//환경 변수 세팅
dotenv.config();

// Supabase 클라이언트 설정
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// HTTPS 인증관련
var privateKey = fs.readFileSync(process.env.HTTPS_PRIVATE_KEY);
var certificate = fs.readFileSync(process.env.HTTPS_CERT_KEY);
var ca = fs.readFileSync(process.env.HTTPS_CA_KEY);
const credentials = { key: privateKey, cert: certificate, ca: ca };

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (token == null) return res.sendStatus(401);

  try {
    // Supabase의 인증 기능을 사용하여 토큰 검증
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.sendStatus(403);
   
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

const app = express();
const port = 3000;

app.use(express.json())
app.use(cors()); // CORS 미들웨어 사용
app.use(authenticateToken);
app.use(notificationRouter);
app.use(giftRouter);

// 현재 모듈의 파일 경로를 가져오기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, "public")));

// mapHtml 경로로 접근 시 map.html 파일 반환
app.get("/mapHtml", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "map.html"));
});

// http 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// https 의존성으로 certificate와 private key로 새로운 서버를 시작
https.createServer(credentials, app).listen(8080, () => {
  console.log(`HTTPS server started on port 8080`);
});

export default admin;
