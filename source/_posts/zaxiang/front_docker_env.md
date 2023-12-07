---
title: 前端 docker 项目如何动态加载环境变量
date: 2023-12-7 14:25:00
tags: 
    - javascript
    - docker
    - shell
    - nginx
---

首先我们需要明白一个前提, 前端打包出来的东西是 html, css, js, 字体, 图片......

他是没有能力访问服务器的环境变量的. 所以如果要动态使用环境变量, 我大概想了一想, 有3种方式.

1. nginx 插件有能力访问环境变量
2. node 环境
3. shell

第一种办法思来想去太麻烦了, 首先Nginx配置一直是让我脑壳疼的东西. 还有就是有些链接和配置是没有转发的, 现在又需要转发太麻烦了.

第二种被否了, 因为如果包含node环境, 包太大, 而且启动的时候build 太慢.

所以我选择了第三种

```dockerfile
# 拷贝 update.env.sh 到容器
COPY update.env.sh /usr/share/nginx/update.env.sh

# 设置 update.env.sh 可执行权限
RUN chmod +x /usr/share/nginx/update.env.sh

# 启动 Nginx
CMD ["/bin/bash", "-c", "/usr/share/nginx/update.env.sh && nginx -g 'daemon off;'"]
```

然后 **shell** 脚本

```shell
#!/bin/bash

sed -i "s|proxy_pass http://.*:.*;|proxy_pass "$VUE_APP_MODEL_BASE_URL"/;|g" /etc/nginx/conf.d/default.conf

# 找包含指定内容的文件
file_path=$(grep -rl 'location.protocol.indexOf("s")<0?' /usr/share/nginx/html)

# 检查是否找到一个文件
if [ -z "$file_path" ]; then
  echo "未找到符合条件的文件。"
  exit 1
fi

# 检查是否找到多个文件
file_count=$(echo "$file_path" | wc -l)
if [ "$file_count" -gt 1 ]; then
  echo "找到多个符合条件的文件，请检查。"
  exit 1
fi

# 替换文件内容
sed -i 's|Nr=window.location.protocol.indexOf("s")<0?"[^"]*":"[^"]*"|Nr=window.location.protocol.indexOf("s")<0?"'$VUE_APP_NOVNC_BASE_URL'":"'$VUE_APP_NOVNC_BASE_URLS'"|' "$file_path"

echo "替换完成。"
```

解决问题.

这个方法本来也很麻烦的, 得益于 chatgpt, 写这种脚本简直不要太轻松.