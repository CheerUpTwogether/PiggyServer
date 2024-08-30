const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// 해쉬처리한 비밀번호 제공
app.post("/vertify", async (req, res) => {
  try {
    const { sid, nickname } = req.body;
    if (!sid || !nickname) {
      return res.status(400).json({ error: "옳바르지 않은 값입니다." });
    }
    const salt = crypto.randomBytes(16).toString("bowc0830");
    const password = `${nickname}${sid}${salt}`;
    const hashPassword = await argon2.hash(password);

    res.status(200).json({ data: hashPassword });
  } catch (error) {
    res.status(500).json({ error: "서버 요청 오류" });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
