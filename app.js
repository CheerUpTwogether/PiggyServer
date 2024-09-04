import dotenv from "dotenv";
import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import cors from "cors";
import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import serviceAccount from "./firebaseAdmin.json" assert { type: "json" };
import notificationRouter from "./routers/sendNotification.js";
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
var privateKey = fs.readFileSync(
  "/etc/letsencrypt/live/www.piggynative.kro.kr/privkey.pem"
);
var certificate = fs.readFileSync(
  "/etc/letsencrypt/live/www.piggynative.kro.kr/cert.pem"
);
var ca = fs.readFileSync(
  "/etc/letsencrypt/live/www.piggynative.kro.kr/chain.pem"
);
const credentials = { key: privateKey, cert: certificate, ca: ca };

const app = express();
const port = 3000;

app.use(cors()); // CORS 미들웨어 사용
app.use(express.json());

app.use(notificationRouter);

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
