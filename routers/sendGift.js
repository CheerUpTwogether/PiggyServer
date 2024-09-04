import express from "express";
import axios from "axios";

const instance = axios.create({
  baseURL: "https://www.piggynative.kro.kr:8080",
});

const router = express.Router();

router.post("/sendGift", async (req, res) => {
  const { phone_number, template_trace_id } = req.body;

  // Supabase에서 디바이스 토큰 조회
  const { data, error } = await supabase
    .from("gift_template_info")
    .select("template_token_id")
    .eq("template_trace_id", template_trace_id);

  if (error) {
    return res
      .status(500)
      .json({ error: "해당 trace Id 의 레코드를 찾을 수없습니다." });
  }

  if (data.length === 0) {
    return res
      .status(404)
      .json({ error: "template Token 조회 결과가 없습니다.." });
  }

  instance.post(
    {
      receiver_type: "PHONE",
      template_token: data[0].template_token_id,
      receivers: [
        {
          receiver_id: phone_number,
          mc_text: "약속을 잘 지키는 당신!! 자랑스럽습니다.",
          sender_name: "piggy(피기)",
        },
      ],
    },
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    }
  );
});
