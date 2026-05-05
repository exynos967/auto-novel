# AutoNovel 轻小说机翻机器人

[![GPL-3.0](https://img.shields.io/github/license/auto-novel/auto-novel)](https://github.com/auto-novel/auto-novel#license)

> 重建巴别塔！！

[轻小说机翻机器人](https://n.novelia.top/)是一个自动生成轻小说机翻并分享的网站。

## 贡献

请务必在编写代码前阅读[贡献指南](https://github.com/auto-novel/auto-novel/blob/main/CONTRIBUTING.md)，感谢所有为本项目做出贡献的人们！

## 部署

> [!WARNING]
> 注意：本项目并不是为了个人部署设计的，不保证所有功能可用和前向兼容。

```bash
# 1. 克隆仓库
git clone https://github.com/auto-novel/auto-novel.git
cd auto-novel

# 2. 生成环境变量配置
cp .env.example .env

# 3. 启动服务
sudo mkdir -p ./data/es/data ./data/es/plugins
sudo chown -R 1000:0 ./data/es/data ./data/es/plugins
sudo chmod -R g+rwX ./data/es/data ./data/es/plugins
docker compose up -d
```

启动后，访问 http://localhost 即可。
