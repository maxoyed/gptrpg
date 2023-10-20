// import { Configuration, OpenAIApi } from "openai";
import extract from "extract-json-from-string";
import { chat } from "./qianfan.js"

// import env from "./env.json" assert { type: "json" };

// const configuration = new Configuration({
//   apiKey: env.OPENAI_API_KEY,
//   baseOptions: {
//     proxy: {
//       protocol: 'http',
//       host: '127.0.0.1',
//       port: 7890,
//     },
//   }
// });

// const openai = new OpenAIApi(configuration);



class ServerAgent {
  constructor(id) {
    this.id = id;
    this.messages = []
  }

  async processMessage(parsedData) {
    try {
      const prompt = `# Introduction

      You are acting as an agent living in a simulated 2 dimensional universe. Your goal is to exist as best as you see fit and meet your needs.
      
      # Capabilities
      
      You have a limited set of capabilities. They are listed below:
      
      * move (up, down, left, right)
      * navigate (to an x,y coordinate)
      * sleep

      # Responses
      
      You must supply your responses in the form of valid JSON objects.  Your responses will specify which of the above actions you intend to take.
      The following is an example of a valid response:

      {
        action: {
          type: "move",
          direction: "up" | "down" | "left" | "right"
        }
      }
      
      # Perceptions
      
      You will have access to data to help you make your decisions on what to do next.
      
      For now, this is the information you have access to:

      Position: 
      ${JSON.stringify(parsedData.position)}

      Surroundings:
      ${JSON.stringify(parsedData.surroundings)}

      Sleepiness:
      ${parsedData.sleepiness} out of 10

      # Rules (YOU MUST OBAY THESE RULES):
      * Your goal is to explore as much of the map as possible
      * Try not to retrace your steps
      * You can not move when sleepiness increase to 10, Sleep will reset your sleepiness to 0.
      * You can only navigate to a position which is not beside the walls.
      * You can't move in the direction of a wall.

      The JSON response indicating the next move is:
      `

      const completion = await this.callOpenAI(prompt, 0);
      if (completion) {
        console.log(`
          位置：
          ${JSON.stringify(parsedData.position)}
          周围环境：
          ${JSON.stringify(parsedData.surroundings)}
          疲惫度：${parsedData.sleepiness} （不能超过10）
        `)
      }
      return completion;

    } catch (error) {
      console.error("Error processing GPT-3 response:", error);
    }
  }

  async callOpenAI(prompt, attempt) {
    if (attempt > 3) {
      return null;
    }

    if (attempt > 0) {
      prompt = "YOU MUST ONLY RESPOND WITH VALID JSON OBJECTS\N" + prompt;
    }

    // const response = await openai.createChatCompletion({
    //   model: "gpt-3.5-turbo",
    //   messages: [{ role: "user", content: prompt }],
    // });
    if (this.messages.length > 51) {
      this.messages.shift()
      if (this.messages[0].role === 'assistant') {
        this.messages.shift()
      }
    }
    if (this.messages.length === 0 || this.messages[this.messages.length - 1].role === 'assistant') {
      this.messages.push({ role: "user", content: prompt })
    }
    const model = "Llama-2-70b-chat"
    const response = await chat(this.messages, model)

    // console.log('OpenAI response', response.data.choices[0].message.content)
    console.log('messages length: ', this.messages.length)
    console.log(`${model} response：\n`, response)

    // const responseObject = this.cleanAndProcess(response.data.choices[0].message.content);
    const responseObject = this.cleanAndProcess(response);
    if (responseObject) {
      // console.log({ prompt, response: response.data.choices[0].message.content, responseObject })
      console.log({ responseObject })
      this.messages.push({ role: "assistant", content: JSON.stringify(responseObject) })
      return responseObject;
    }

    return await this.callOpenAI(prompt, attempt + 1);
  }

  validateJson(json) {
    if (json?.action?.type === 'move') {
      return ['up', 'down', 'left', 'right'].includes(json.action.direction);
    }
    if (json?.action?.type === 'navigate') {
      return json?.action?.x && json?.action?.y;
    }
    if (json?.action?.type === 'sleep' || json?.action?.type === 'wait') {
      return true;
    }
    return false;
  }

  cleanAndProcess(text) {
    const extractedJson = extract(text)[0];

    if (!extractedJson) {
      return null;
    }
    if (!this.validateJson(extractedJson)) {
      return null;
    }

    return extractedJson;
  }
}

export default ServerAgent;