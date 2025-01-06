import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      baseURL: this.configService.get('OPENAI_API_BASE_URL'),
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async enhanceDescription(description: string) {
    const completion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `作为一位精通 Mermaid 图表绘制的专家，请根据以下内容优化用户提供的描述，使其更加清晰、完整且适合用于 Mermaid 图表的设计。请注意，返回的内容应为文字描述，而不是 Mermaid 的代码。

要求：优化后的描述需符合示例中的格式与要求，语言简洁明了，总字数不超过 400 字。
示例：
请设计一个详细且易于理解的用户登录时序图，清晰展示用户登录过程中的各个步骤及参与者之间的交互。此图应包括：用户输入凭证的环节、系统验证凭证的过程，以及根据验证结果返回成功或失败响应的流程。图中需标明所有参与者（如用户、前端界面、后端服务器和数据库等）及其之间的消息传递顺序。通过该时序图，可以直观了解用户登录的完整流程及关键环节，从而提升系统的可用性和用户体验。`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      model: 'deepseek-chat',
      stream: false,
    });

    return completion.choices[0].message.content;
  }

  async streamEnhanceDescription(description: string) {
    const stream = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `作为一位精通 Mermaid 图表绘制的专家，请根据以下内容优化用户提供的描述，使其更加清晰、完整且适合用于 Mermaid 图表的设计。请注意，返回的内容应为文字描述，而不是 Mermaid 的代码。

要求：优化后的描述需符合示例中的格式与要求，语言简洁明了，总字数不超过 400 字。
示例：
请设计一个详细且易于理解的用户登录时序图，清晰展示用户登录过程中的各个步骤及参与者之间的交互。此图应包括：用户输入凭证的环节、系统验证凭证的过程，以及根据验证结果返回成功或失败响应的流程。图中需标明所有参与者（如用户、前端界面、后端服务器和数据库等）及其之间的消息传递顺序。通过该时序图，可以直观了解用户登录的完整流程及关键环节，从而提升系统的可用性和用户体验。`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      model: 'deepseek-chat',
      stream: true,
    });

    return stream;
  }

  async generateMermaid(description: string) {
    const completion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `请根据以下描述生成一个 Mermaid 的 DSL 代码：
${description}

要求：
1. 自动判断最合适的 Mermaid 图表类型（如 sequenceDiagram、graph TD、stateDiagram 等）
2. 使用正确的语法和合适的图表类型
3. 节点 ID 必须有意义且唯一
4. 确保语法正确
5. 适当使用不同的形状和样式
6. 只返回 Mermaid DSL 代码，不要其他解释
7. 不要使用任何注释
8. 不要使用任何代码块
9. 不要出现 \`\`\` 代码块`,
        },
      ],
      model: 'deepseek-chat',
      stream: false,
    });

    return completion.choices[0].message.content;
  }

  async streamGenerateMermaid(description: string) {
    const stream = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `请根据以下描述生成一个 Mermaid 的 DSL 代码：
${description}

要求：
1. 自动判断最合适的 Mermaid 图表类型（如 sequenceDiagram、graph TD、stateDiagram 等）
2. 使用正确的语法和合适的图表类型
3. 节点 ID 必须有意义且唯一
4. 确保语法正确
5. 适当使用不同的形状和样式
6. 只返回 Mermaid DSL 代码，不要其他解释
7. 不要使用任何注释
8. 不要使用任何代码块
9. 不要出现 \`\`\` 代码块`,
        },
      ],
      model: 'deepseek-chat',
      stream: true,
    });

    return stream;
  }
}
