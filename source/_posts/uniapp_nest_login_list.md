

### 增加login

因为现在没有Https证书，在申请当中，所以无法通过 wx 登录进行测试，所以先写一个临时的接口

于是我新建了一个 **Controller**

```ts
  /**
   * 通过微信ID登录或者创建用户
   * @param wxId String
   * @returns UserReturn
   */
  @Post()
  async loginWxUserByUnionid(@Body('wxId') wxId: string): Promise<UserReturn> {
    const existUser = await this.userService.findUserByWxId(wxId);
    if (!!existUser) {
      //更新用户激活时间
      existUser.activeTime = new Date();
      this.userService.updateUser(existUser.id, existUser);
      //直接拿token, 返回用户
      const timex = new Date().getTime().toString();
      const token = this.jwtService.generateToken(existUser.id + timex);

      return {
        userName: existUser.name,
        token: token,
      };
    }

    const newUser = new User();
    newUser.wxId = wxId;
    newUser.name = this.generateRandomName(); // 生成随机名称
    newUser.createTime = new Date(); // 自动填写创建时间
    newUser.activeTime = new Date(); // 暂未激活，设置为 null
    newUser.status = UserStatus.wxUser;

    try {
      const u = await this.userService.createUser(newUser);

      const timex = new Date().getTime().toString();
      const token = this.jwtService.generateToken(u.id + timex);

      return {
        userName: u.name,
        token: token,
      };
    } catch (ex) {}
  }

  private generateRandomName(): string {
    const prefix = 'User';
    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const username = prefix + randomSuffix.padStart(5, '0');
    return username;
  }
```

这样的代码只要有微信id来，就可以登录或者创建一个用户, 然后通过postman测试一拨，没问题

```
{
    "userName": "User09292",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMTY5MDA5Njk2OTIzMyIsImlhdCI6MTY5MDA5Njk3MSwiZXhwIjoxNjkwMTAwNTcxfQ.cm_G-jCmMdlmQqDvB0QAA5aFY6Uq8V6tLQzktv9_8lg"
}
```

### 02. 通过 jwt 获取用户

首先这个方法我们需要验证 jwt, 验证token ok。

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtCommonService } from '../auth/jwt.common.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtCommonService: JwtCommonService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token || !this.jwtCommonService.verifyToken(token)) {
      return false;
    }

    return true;
  }
}
```

写一个守卫，因为 list.controller.ts 全部都需要验证，所以在 controller 中加入守卫

```ts
@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListController {
  constructor(private readonly listService: ListService) {}
  //...
```

在加入守卫以后，我们需要获取用户 User，通过 token，使用 `jwtService.decode` 就ok了, 只是我不想每个页面都写，所以用拦截器吧。

具体文档看这里 https://docs.nestjs.cn/9/interceptors

```ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements NestInterceptor {
  constructor(private readonly jwtService: JwtService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decodedToken = this.jwtService.decode(token);
      if (decodedToken) {
        request.user = decodedToken['user'];
      }
    }

    return next.handle();
  }
}
```

由于他不是全部都需要使用，所以还是每个 controller 自己选择使用

```ts
@Post()
async create(@Req() request): Promise<List> {
  console.log(request.user);
  return null;
}
```

那么我们来验证一下，启动项目，打开PostMan, 测试一下以后我修改了代码

```ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements NestInterceptor {
  constructor(private readonly jwtService: JwtService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (!!request.userId) {
      return next.handle();
    }
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decodedToken = this.jwtService.decode(token);
      if (decodedToken) {
        request.userId = decodedToken['userId'];
      }
    }

    return next.handle();
  }
}
```

但是只能返回 userId，所以我要修改一下 token 生成的方法

```ts
generateToken(user: User): string {
  const payload = { user };
  const token = this.jwtService.sign(payload);
  this.logger.log(`Generated token for user ${user.id}`);
  return token;
}
```

然后把其他关联的接口修改一下, 然后靠下面的方法就能获取 user 了

```ts
@Post('create')
async create(@Req() request): Promise<List> {
  console.log(request.user);
  return null;  
}
```
### 03. 添加任务

在搞定了用户登录和获取以后，现在需要添加任务，首先我们需要验证一下参数。

https://docs.nestjs.com/techniques/validation 文档在这里

```ts
app.useGlobalPipes(new ValidationPipe());
```

然后新建一个 **create.task.dto.ts** 因为 task，不是所有字段都要检查，和 entity 区分一下

```ts
import { Entity, Column } from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  Length,
  IsDate,
  IsOptional,
  MinDate,
} from 'class-validator';

@Entity('list')
export class List {
  @Column()
  @IsNotEmpty()
  @IsString()
  @Length(5, 30)
  title: string;

  @Column()
  @IsNotEmpty()
  @IsDate()
  curDay: Date;

  @Column()
  @IsNotEmpty()
  @IsDate()
  @MinDate(new Date())
  taskTime: Date;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  description: string;
}
```

然后随意写一个添加task的service，引用, 名字没取好，但是懒得改了。

```ts
@Post('create')
async create(@Body() task: TaskDto, @Req() request): Promise<List> {
  const list = new List();
  list.title = task.title;
  list.curDay = task.curDay;
  list.description = task.description;
  list.taskTime = task.taskTime;
  list.userId = request.user.id;

  return await this.listService.create(list);
}
```

jwt 验证我写了一个守卫

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtCommonService } from '../auth/jwt.common.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtCommonService: JwtCommonService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token || !this.jwtCommonService.verifyToken(token)) {
      return false;
    }

    return true;
  }
}
```

然后postman 测试一下, 添加成功

### 04. 编辑任务

类似添加的思路

```ts
@Put(':id')
async update(
  @Param('id') id: number,
  @Body() list: TaskDto,
  @Req() request,
): Promise<void> {
  const task = await this.listService.findOne(id);
  if (task === null) return null;

  if (task.userId !== request.user.id)
    throw new HttpException('Forbidden', HttpStatus.NOT_FOUND);

  const entity = new List();
  for (const key in list) {
    entity[key] = list[key];
  }
  await this.listService.update(id, entity);
}
```

### 05. 获取

单个获取，就直接验证 token，验证 userId，然后拿取

```ts
@Get(':id')
async findOne(@Param('id') id: number, @Req() request): Promise<List> {
  const result = await this.listService.findOne(id);
  if (result === null) throw new HttpException('404', HttpStatus.NOT_FOUND);

  if (result.userId !== request.user.id) {
    throw new HttpException('Forbidden', HttpStatus.NOT_FOUND);
  }

  return result;
}
```

获取所有，这里其实有一个疑问，就是 todolist 这种类型的应用是否需要分页获取，后来想了一下，就当前端练习一下吧。

```ts
@Get('/all/:page')
async findAll(@Param('page') page: number, @Req() request): Promise<List[]> {
  const userId = request.user.id;
  return this.listService.findAll(userId, {
    page,
    pageSize: 25,
  });
}

findAll(userId: number, options: IPage): Promise<List[]> {
  return this.listRepository.find({
    where: {
      userId,
    },
    skip: (options.page - 1) * options.pageSize,
    take: options.pageSize,
  });
}
```

测试一下没问题

### 06. 删除

```ts
@Delete(':id')
async remove(@Param('id') id: number): Promise<void> {
  return this.listService.remove(id);
}
```
### 07. 提醒和过期

需要维护一个轮询，也就是说利用 linux corn 这种机制，然后定期检查是否有需要提醒的任务。

不仅仅如此，通知有多种方式，比如邮件，比如微信提醒，比如app通知，比如短信，所以需要封装一个抽象类或者接口。

```
npm install --save @nestjs/schedule cron
```

然后写一个 service

```ts
import { Cron } from '@nestjs/schedule';

export class TaskCronService {
  @Cron('0 * * * * *')
  handleCron() {
    console.log('Cron Job executed!');
  }
}
```

在主程序注册

```ts
imports: [
  ScheduleModule.forRoot(),
],
providers:[TaskCronService],
```

就可以开始执行了，现在需要引入其他service, 比如mailService之类的，下面就是代码的成品

```ts
import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { ListService } from 'src/list/list.service';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/common/mail.service';
import * as moment from 'moment';

const emailContent = `
<h1>任务提醒</h1>
<p>尊敬的用户，您设置的任务已经到了预定的时间：</p>
<p><strong>任务名称：</strong> {taskName}</p>
<p><strong>任务时间：</strong> {taskTime}</p>
<p><strong>任务描述：</strong> {description}</p>
<p>请及时完成您的任务。</p>
<p>感谢您使用我们的服务！</p>
`;

@Injectable()
export class TaskCronService {
  constructor(
    private readonly listService: ListService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}
  @Cron('0 * * * * *')
  async handleCron() {
    console.log('执行了任务');
    const currentTime = new Date().getTime();
    const maxDiff = 59; //秒
    const tasks = await this.listService.findAllNormalTask();
    const filteredTasks = tasks.filter((task) => {
      const taskTime = task.taskTime;
      const timeDifference = Math.abs(taskTime.getTime() - currentTime) / 1000; // 转换为秒
      return timeDifference <= maxDiff;
    });

    //目前需要支持四种提醒方式
    //1. 邮箱
    //2. app通知
    //3. 微信通知
    //4. 短信通知
    //为了性能，最好发送都是调用其他服务
    for (let i = 0; i < filteredTasks.length; i++) {
      const task = filteredTasks[i];
      const user = await this.userService.findUserById(task.userId);
      if (user !== null) {
        if (!!user.email) {
          this.mailService.sendEmail(
            user.email,
            task.title,
            emailContent
              .replace('{taskName}', task.title)
              .replace(
                '{taskTime}',
                moment(task.taskTime).format('YYYY-MM-DD HH:mm'),
              )
              .replace('description', task.description),
          );
        }

        if (!!user.phone && !!user.phoneCode) {
          //todo..
        }

        //其他的需要做到了再写
      }
    }
  }
}
```

mailService 我使用了 nodemailer，下面是代码

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const mailConfig = {
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(mailConfig);
  }

  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject,
      text: content,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
```

### 08. 总结

这样的话，一个基本的app的api就可以有了，虽然功能很简陋，后续功能后续再补。