const argon2 = require("argon2");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { sid, nickname } = req.body;
    if (!sid || !nickname) {
      return res.status(400).json({ error: "옳바르지 않은 값입니다." });
    }
    const secretSaltKey = process.env.SALT;
    const password = `${nickname}${sid}${secretSaltKey}`;
    const hashPassword = await argon2.hash(password);

    res.status(200).json({ data: hashPassword });
  } catch (error) {
    console.error("Error occurred:", error); // 에러 로그 출력
    res.status(500).json({ error: "서버 요청 오류" });
  }
};
