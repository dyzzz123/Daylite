# RSS源使用指南

## 常见问题

### 1. 连接超时错误

**错误信息：** "无法解析RSS源: Request timed out after 15000ms"

**原因：**
- RSS服务器响应缓慢
- 网络连接问题
- RSS源限制了服务端访问
- RSS源暂时不可用

**解决方案：**
1. 稍后重试
2. 尝试使用该RSS源的镜像或替代源
3. 在浏览器中验证RSS URL是否可访问

### 2. 常见RSS源状态

| RSS源 | URL | 状态 | 说明 |
|-------|-----|------|------|
| 36氪 | https://36kr.com/feed | ✅ 可用 | 科技创业新闻 |
| 少数派 | https://sspai.com/feed | ✅ 可用 | 数字工具和效率 |
| IT之家 | https://www.ithome.com/rss/ | ✅ 可用 | IT行业新闻 |
| 阮一峰网络日志 | https://www.ruanyifeng.com/blog/atom.xml | ✅ 可用 | 技术博客 |
| TechCrunch | https://techcrunch.com/feed/ | ✅ 可用 | 英文科技新闻 |
| V2EX | https://www.v2ex.com/index.xml | ⚠️ 超时 | 可能限制服务端访问 |
| RSSHub | https://rsshub.app/* | ⚠️ 缓慢 | 响应较慢，可尝试镜像 |

### 3. RSSHub镜像

如果 `rsshub.app` 无法访问，可以尝试以下镜像：

- https://rss.zhully.xyz/
- https://rss.rssforever.com/
- https://rss.tt.sh/

**示例：**
- 原始：`https://rsshub.app/jandan/top`
- 镜像：`https://rss.zhully.xyz/jandan/top`

### 4. 推荐的稳定RSS源

#### 科技新闻类
- 36氪：https://36kr.com/feed
- 少数派：https://sspai.com/feed
- IT之家：https://www.ithome.com/rss/
- 爱范儿：https://www.ifanr.com/feed
- 虎嗅网：https://www.huxiu.com/rss/0.xml

#### 技术博客类
- 阮一峰网络日志：https://www.ruanyifeng.com/blog/atom.xml
- TechCrunch：https://techcrunch.com/feed/
- The Verge：https://www.theverge.com/rss/index.xml
- Hacker News：https://news.ycombinator.com/rss

#### 设计类
- 优设网：https://www.uisdc.com/feed
- 站酷：https://www.zcool.com.cn/feed.asp

#### 财经类
- 财新网：https://feed.caixin.com/rss/caixin.xml
- 华尔街日报中文版：https://cn.wsj.com/rss.xml

### 5. 验证RSS源

在添加RSS源之前，你可以：
1. 在浏览器中直接访问RSS URL
2. 使用在线RSS验证工具
3. 查看是否显示XML格式的内容

### 6. 技术说明

系统支持以下RSS格式：
- RSS 2.0
- Atom 1.0
- RDF 1.0

系统特性：
- 自动重试（最多3次，使用不同User-Agent）
- 15秒超时
- 详细的错误提示
- 自动获取RSS元数据

### 7. 故障排除

**Q: 为什么有些RSS源在浏览器可以打开，但在系统中无法验证？**

A: 某些网站可能：
- 限制来自服务端的请求（浏览器访问正常，但服务端访问被拒绝）
- 需要特定的User-Agent或Referer
- 有反爬虫机制

**Q: 如何解决V2EX等网站的RSS无法访问问题？**

A: 这些网站限制了服务端访问，可以：
1. 使用RSSHub等第三方RSS生成器
2. 寻找该网站的其他RSS源
3. 联系网站管理员申请访问许可

**Q: RSSHub为什么经常超时？**

A: RSSHub是一个公共服务：
- 访问速度取决于你的网络环境
- 建议使用RSSHub镜像
- 或自行搭建RSSHub实例

### 8. 最佳实践

1. **优先选择官方RSS源**
   - 官方源通常更稳定
   - 更新更及时

2. **定期检查RSS源状态**
   - 某些RSS源可能失效
   - 及时删除不可用的源

3. **合理设置抓取频率**
   - 避免过于频繁的抓取
   - 尊重网站的服务器资源

4. **使用RSS聚合器**
   - 对于没有官方RSS的网站
   - 可以使用RSSHub生成RSS

## 联系支持

如果遇到问题：
1. 查看本文档的故障排除部分
2. 检查RSS URL是否正确
3. 尝试使用推荐的稳定RSS源
4. 在GitHub上提交Issue
