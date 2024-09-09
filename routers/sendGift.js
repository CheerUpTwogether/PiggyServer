import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { supabase } from "../app.js";
import { v4 as uuidv4 } from "uuid";

const instance = axios.create({
  baseURL: "https://gateway-giftbiz.kakao.com",
});

dotenv.config();

const router = express.Router();

router.post("/sendGift", async (req, res) => {
  const { user, phone_number, template_trace_id } = req.body;
  const myData = req.user;
  // Supabase에서 현재 잔액 가져오기
  const { data: piggyData, error: piggyError } = await supabase
    .from("piggy")
    .select("latest_piggy_count")
    .eq("user_id", myData.user.id);
  if (piggyError) {
    return res.status(500).json({ error: "내정보를 불러오지 못했습니다." });
  }

  if (piggyData.length === 0) {
    return res.status(404).json({ error: "내 피기를 불러오지 못했습니다." });
  }

  // Supabase에서템플릿 토큰 조회
  const { data:templateData, error: templateError } = await supabase
    .from("gift_template_info")
    .select("template_token_id, price")
    .eq("template_trace_id", template_trace_id);
  if (templateError) {
    return res
      .status(500)
      .json({ error: "해당 trace Id 의 레코드를 찾을 수없습니다." });
  }

  if (templateData.length === 0) {
    return res
      .status(412)
      .json({ error: "template Token 조회 결과 또는 권한이 없습니다." });
  }
  const myPiggy = parseInt(piggyData[0].latest_piggy_count);
  const price = parseInt(templateData[0].price);
  if (myPiggy < price) {
    return res.status(408).json({ error: "피기 수량 부족." });
  }

  const { data:piggyChangeData, error: piggyChangeError } = await supabase
	.from("piggy_changed_log")
	.insert([{
	  user_id: myData.user.id,
	  present_piggy_count: myPiggy,
	  diff_piggy_count: -price,
	  changed_category: "구매",
	  purchase_id: template_trace_id,
	},]).select("*");

  if (piggyChangeError) {
    return res
      .status(500)
      .json({ error: "상품을 구매하는중 문제가 발생했습니다." });
  }

  if (piggyChangeData.length === 0) {
    return res
      .status(412)
      .json({ error: "피기 정산 테이블  조회 결과 또는 권한이 없습니다." });
  }

  await instance.post(
    "/openapi/giftbiz/v1/template/order",
    {
      receiver_type: "PHONE",
      template_token: templateData[0].template_token_id,
      receivers: [
        {
          receiver_id: phone_number,
          mc_text: "약속을 잘 지키는 당신!! 자랑스럽습니다.",
          sender_name: "piggy(피기)",
        },
      ],
      external_order_id: uuidv4(),
    },
    {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
      },
    }
  );
  return res.status(200).json({ success: "정상적으로 선물을 발송하였습니다.", latest_piggy_count: myPiggy-price  });
});

export default router;
