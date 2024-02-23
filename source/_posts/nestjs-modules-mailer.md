---
title: nestjs modules mailer
date: 2024-02-23 14:45:22
tags: 
    - nestjs
    - typescript
    - 后端
---


## 文档

[How to use? · NestJS - Mailer (nest-modules.github.io)](https://nest-modules.github.io/mailer/docs/mailer.html)

[yanarp/nestjs-mailer：一个简单的实现示例，使用基于nodemailer构建的nest js的mailer模块，🌈使用邮件模板。 (github.com)](https://github.com/yanarp/nestjs-mailer?tab=readme-ov-file)

https://github.com/leemunroe/responsive-html-email-template

## 目标和基本使用

```bash
npm install --save @nestjs-modules/mailer nodemailer
npm install --save-dev @types/nodemailer
```

在 module 中引入

```tsx
MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          service: configService.get('MAIL_SERVICE'),
          auth: {
            user: configService.get('MAIL_USERNAME'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get('MAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
```

我的目的是使用QQ邮箱发送邮件, 这样配置就ok了. 接下来就可以调用

```tsx
async sendMail(to: string, subject: string, template: string, html: string): Promise<void> {
        await this.mailerService.sendMail({
            to,
            from: this.configService.get('MAIL_FROM'),
            subject,
            html,
        });
    }
```

## 模版的使用

首先你可以不使用模版, 就用html, 模版也是编译成html, 只能说模版在多个模版情况下, 你好做一点.

```tsx
async sendMail(to: string, subject: string, template: string = "diff", context: any): Promise<void> {      
    let html = templates[template];
    if(context) {
        const keys = Object.keys(context);
        keys.forEach(key => {
            html = html.replace(`{{${key}}}`, context[key]);
        })
    }
    await this.mailerService.sendMail({
        to,
        from: this.configService.get('MAIL_FROM'),
        subject,            
        html
    });
}
```

如果要使用模版功能

```tsx
template: {
  dir: __dirname + '/mail.template',
  adapter: new EjsAdapter(), 
  options: {
    strict: true,
  },
},
```

就这样, 选择你需要的模版引擎, 我这里用 `ejs`, 因为我熟悉. `context` 传值就**ok**了