import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import {supabase} from "../app.js";
import { v4 as uuidv4 } from 'uuid';

const instance = axios.create({
  baseURL: 'https://gateway-giftbiz.kakao.com',
});

dotenv.config();

const router = express.Router();

router.post("/sendGift", async (req, res) => {
  const { user, phone_number, template_trace_id } = req.body;
  const myData = req.user;  
  console.log(myData.user.id);   
  // Supabase에서 현재 잔액 가져오기 
  const { data:piggyData, error:piggyError } = await supabase
    .from("piggy")
    .select("latest_piggy_count")
    .eq("user_id", myData.user.id);
  console.log(piggyData);
  if (piggyError) {
    return res
      .status(500)
      .json({ error: "내정보를 불러오지 못했습니다." });
  }

  if (piggyData.length === 0) {
    return res
      .status(404)
      .json({ error: "내 피기를 불러오지 못했습니다." });
  }


  // Supabase에서템플릿 토큰 조회
  const { data, error } = await supabase
    .from("gift_template_info")
    .select("template_token_id, price")
    .eq("template_trace_id", template_trace_id);
  if (error) {
    return res
      .status(500)
      .json({ error: "해당 trace Id 의 레코드를 찾을 수없습니다." });
  }
  
  console.log(template_trace_id);


  if (data.length === 0) {
    return res
      .status(412)
      .json({ error: "template Token 조회 결과 또는 권한이 없습니다." });
  }
  const mypiggy = parseInt(piggyData[0].latest_piggy_count);
  const price = parseInt(data[0].price);
  console.log(mypiggy);
  console.log(price);
  if(mypiggy < price){
     return res
      .status(408)
      .json({ error: "피기 수량 부족." });
  }
  

  await instance.post('/openapi/giftbiz/v1/template/order',
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
      external_order_id: uuidv4()
    },
    {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
      },
    }
  );
  return res.status(200).json({ success: "정상적으로 선물을 발송하였습니다."});
});

export default router;
