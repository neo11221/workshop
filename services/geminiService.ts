import { GoogleGenAI } from "@google/genai";
import { UserProfile, RankTitle } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getEncouragement = async (profile: UserProfile, currentTitle: RankTitle) => {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("API Key not found");

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `
        你是一位溫暖幽默的「學習工坊」導師。
        目前學生的資訊：
        - 名字：${profile.name}
        - 目前稱號：${currentTitle.name}
        - 目前剩餘點數：${profile.points}
        - 累計獲得點數：${profile.totalEarned}

        請寫一段簡短（30-50字）的鼓勵話語，讚美他的成就並鼓勵他繼續學習或去商城兌換獎勵。
        請使用親切的語氣。
      `,
    });
    return response.text() || "繼續努力，學習的路上你並不孤單！";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "保持學習的熱情，你是最棒的！";
  }
};

export const generateDailyMission = async (profile: UserProfile) => {
  try {
    const ai = getAIClient();
    if (!ai) throw new Error("API Key not found");

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `
        請為「學習工坊」的用戶生成一個今日隨機學習任務。
        用戶目前等級：${profile.totalEarned} 點。
        
        請以 JSON 格式輸出：
        {
          "title": "任務名稱",
          "description": "任務具體內容（例如：閱讀一篇科技文章並寫下心得）",
          "points": 獎勵點數 (50-200 之間)
        }
      `,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text() || '{}';
    return JSON.parse(text);
  } catch (error) {
    return {
      title: "每日閱讀",
      description: "閱讀一本好書 30 分鐘，並記錄下最喜歡的一句話。",
      points: 100
    };
  }
};
