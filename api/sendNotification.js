const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const schedule = require("node-schedule");

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

let serviceAccount = require("./firebaseAdmin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function scheduleNotification(messagePayload) {
  try {
    console.log("실행");
    const response = await admin.messaging().send(messagePayload);
    console.log("예약 알림 발송 완료:", response);
  } catch (error) {
    console.error("예약 알림을 발송하지 못했습니다.:", error);
  }
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { id, message, time } = req.body;

    // 타임 문자열을 Date 객체로 변환
    const year = parseInt(time.substring(0, 4));
    const month = parseInt(time.substring(4, 6)) - 1; // 월은 0부터 시작
    const day = parseInt(time.substring(6, 8));
    const hour = parseInt(time.substring(8, 10));
    const minute = parseInt(time.substring(10, 12));
    const second = parseInt(time.substring(12, 14));

    const scheduleTime = new Date(year, month, day, hour, minute, second);

    try {
      // Supabase에서 디바이스 토큰 조회
      const { data, error } = await supabase
        .from("users_nickname")
        .select("device_token")
        .eq("id", id);

      if (error) {
        return res
          .status(500)
          .json({ error: "유저의 토큰을 찾을 수 없습니다." });
      }

      if (data.length > 0) {
        // 각 토큰으로 FCM 메시지 전송
        const messagePayload = {
          notification: {
            title: message.title,
            body: message.body,
          },
          token: data[0].device_token,
        };

        // 스케줄러를 사용하여 예약된 시간에 알림 발송
        schedule.scheduleJob(scheduleTime, async function () {
          await scheduleNotification(messagePayload);
        });

        res.status(200).json({
          success: `성공적으로 알림을 예약했습니다.`,
          utcTime: scheduleTime,
          kstTime: scheduleTime.toLocaleString("ko-KR"),
        });
      }
    } catch (error) {
      console.error("에러 로그:", error);
      res.status(500).json({ error: "알림을 발송하지 못했습니다." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}