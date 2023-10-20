import request from "request"
import env from "./env.json" assert { type: "json" };

const model_dict = {
    'ERNIE-Bot-4': 'completions_pro',
    'ERNIE-Bot': 'completions',
    'ERNIE-Bot-turbo': 'eb-instant',
    'BLOOMZ-7B': 'bloomz_7b1',
    'Llama-2-13b-chat': 'llama_2_13b',
    'Llama-2-70b-chat': 'llama_2_70b',
    'ChatGLM2-6B-32K': 'chatglm2_6b_32k',
}

export async function chat(messages, model = 'ERNIE-Bot-4') {
    const options = {
        'method': 'POST',
        'url': `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${model_dict[model]}?access_token=${await getAccessToken()}`,
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "messages": messages,
            "top_p": 0.85,
            "penalty_score": 1.2
        })

    };

    return new Promise((resolve, reject) => {
        request(options, function (error, response) {
            if (error) { reject(error) }
            else {
                console.log('prompt_tokens: ', JSON.parse(response.body).usage.prompt_tokens)
                console.log('completion_tokens: ', JSON.parse(response.body).usage.completion_tokens)
                console.log('total_tokens: ', JSON.parse(response.body).usage.total_tokens)
                resolve(JSON.parse(response.body).result)
            }
        });
    })
}

/**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
function getAccessToken() {

    const options = {
        'method': 'POST',
        'url': 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + env.QIANFAN_API_KEY + '&client_secret=' + env.QIANFAN_SECRET_KEY,
    }
    return new Promise((resolve, reject) => {
        request(options, (error, response) => {
            if (error) { reject(error) }
            else { resolve(JSON.parse(response.body).access_token) }
        })
    })
}
