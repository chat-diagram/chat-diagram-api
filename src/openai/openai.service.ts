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

  async streamGenerateMermaid(description: string, context?: string) {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `作为一位精通 Mermaid 图表绘制的专家，请根据用户的描述生成相应的 Mermaid 代码。请确保生成的代码符合 Mermaid 语法规范，并能准确表达用户需求。

要求：
1. 只输出 Mermaid 代码，不要包含任何其他说明文字
2. 确保代码的可读性和可维护性
3. 使用恰当的图表类型（如流程图、时序图、类图等）
4. 合理组织图表结构，使其清晰易懂
5. 适当添加注释，帮助理解代码含义

示例输出：
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: 输入用户名和密码
    Frontend->>Backend: 发送登录请求
    Backend->>Database: 验证用户信息
    Database-->>Backend: 返回验证结果
    
    alt 验证成功
        Backend-->>Frontend: 返回登录成功
        Frontend-->>User: 显示登录成功
    else 验证失败
        Backend-->>Frontend: 返回登录失败
        Frontend-->>User: 显示错误信息
    end`,
      },
    ];

    if (context) {
      messages.push({
        role: 'user',
        content: `当前版本的 Mermaid 代码如下，请参考这个上下文来生成新版本：\n\`\`\`mermaid\n${context}\n\`\`\``,
      });
    }

    messages.push({
      role: 'user',
      content: description,
    });

    const stream = await this.openai.chat.completions.create({
      messages,
      model: 'deepseek-chat',
      stream: true,
    });

    return stream;
  }

  async generateTitle(description: string) {
    const stream = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `请根据以下描述生成一个简洁的标题，要求：
1. 标题长度不超过 15 个字
2. 突出流程或功能的核心特点
3. 使用专业且准确的词汇
4. 只返回标题文本，不要其他解释或标点符号

示例描述：用户在系统中输入用户名和密码，系统验证用户身份，如果验证通过则生成 JWT token 并返回，如果验证失败则返回错误信息。
示例标题：用户登录认证流程

请为以下描述生成标题：
${description}`,
        },
      ],
      model: 'deepseek-chat',
      stream: true,
    });

    return stream;
  }

  async streamGenerateTitle(description: string) {
    return this.generateTitle(description);
  }

  async generateVersionComment(oldDescription: string, newDescription: string) {
    const stream = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `请对比前后两个版本的描述，生成一个简洁的版本说明，要求：
1. 长度不超过 20 个字
2. 突出主要变化点
3. 使用简洁的动词开头
4. 只返回说明文本，不要其他解释或标点符号

示例旧描述：用户输入用户名和密码，系统验证身份并返回结果
示例新描述：用户输入用户名、密码和验证码，系统先验证验证码，再验证身份，最后返回结果
示例说明：添加验证码校验步骤

请为以下新旧描述生成版本说明：

旧描述：
${oldDescription}

新描述：
${newDescription}`,
        },
      ],
      model: 'deepseek-chat',
      stream: true,
    });

    return stream;
  }

  async streamGenerateVersionComment(
    oldDescription: string,
    newDescription: string,
  ) {
    return this.generateVersionComment(oldDescription, newDescription);
  }
}
