const express = require("express");
const cors = require("cors");
const path = require("path");
const argon2 = require("argon2");

const app = express();
const port = 3000;

app.use(cors()); // CORS 미들웨어 사용
app.use(express.json());

// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, "public")));

// mapHtml 경로로 접근 시 map.html 파일 반환
app.get("/mapHtml", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "map.html"));
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
