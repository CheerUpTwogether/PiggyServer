require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const { createClient } = require("@supabase/supabase-js");

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Firebase Admin SDK 초기화
let serviceAccount = require("./firebaseAdmin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// fs and https 모듈 가져오기
const https = require("https");
const fs = require("fs");

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

async function scheduleNotification(messagePayload) {
  try {
    const response = await admin.messaging().send(messagePayload);
    console.log("예약 알림 발송 완료:", response);
  } catch (error) {
    console.error("예약 알림을 발송하지 못했습니다.:", error);
  }
}

app.post("/sendNotification", async (req, res) => {
 
  const { id, message, time } = req.body;
 
  // Supabase에서 디바이스 토큰 조회
  const { data, error } = await supabase
    .from("users_nickname")
    .select("device_token")
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: "유저의 토큰을 찾을 수 없습니다." });
  }

  if (data.length === 0) {
    return res.status(404).json({ error: "디바이스 토큰을 찾을 수 없습니다." });
  }

  // 각 토큰으로 FCM 메시지 전송
  const messagePayload = {
    notification: {
      title: message.title,
      body: message.body,
    },
    token: data[0].device_token,
  };

  if (time) {
    // 타임 문자열을 Date 객체로 변환
    const year = parseInt(time.substring(0, 4));
    const month = parseInt(time.substring(4, 6)) - 1; // 월은 0부터 시작
    const day = parseInt(time.substring(6, 8));
    const hour = parseInt(time.substring(8, 10));
    const minute = parseInt(time.substring(10, 12));
    const second = parseInt(time.substring(12, 14));

    const scheduleTime = new Date(year, month, day, hour, minute, second);

    // 스케줄러를 사용하여 예약된 시간에 알림 발송
    schedule.scheduleJob(scheduleTime, async function () {
      await scheduleNotification(messagePayload);
    });

    res.status(200).json({
      success: `성공적으로 알림을 예약했습니다.`,
      utcTime: scheduleTime,
      kstTime: scheduleTime.toLocaleString("ko-KR"),
    });
  } else {
    // time이 제공되지 않는 경우 즉시 알림 발송
    await scheduleNotification(messagePayload);

    res.status(200).json({
      success: `성공적으로 알림을 즉시 발송했습니다.`,
    });
  }
});

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
