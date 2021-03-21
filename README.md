# Times-all-bot

各分報の投稿をひとつのチャネルに集約する Slack Bot

- [Serverless Framework](https://www.serverless.com/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [Bolt of JavaScript](https://github.com/slackapi/bolt-js)

で作成しています。

## セットアップ

自分のワークスペースに導入するまでの方法です。

### 1. Slackアプリの作成

https://api.slack.com/apps にアクセスし、`Create New App`で新しいアプリを作成します。

![](https://i.gyazo.com/ec073dbdc32aebfd81d04ef2fdc2626c.png)

作成後、サイドバーから `OAuth & Permissions` にアクセスしてアプリの権限のスコープを設定します。設定するスコープは`chat:write`と`channels:history`です。

![](https://i.gyazo.com/d318576f6bff9d4963793570d2d0695c.png)

その後、ページ上部の Install to Workspace でワークスペースにアプリを追加します。
アプリ追加後表示される OAuth Token は後で使うのでメモしましょう。

![](https://i.gyazo.com/1f114e3934718cfbba2930d4fc877318.png)

あと、サイドバーにある`Basic Information`にアクセスして`Signing Secret`もメモしてください。

![](https://i.gyazo.com/b460141ebf59d9212e80ab6f390e7259.png)

以上でいったん Slack アプリ側の設定は完了です。

### 2. Lambdaへのデプロイ
まず任意のディレクトリにプロジェクトをクローンします。

```
$ git clone https://github.com/kawamataryo/times-all-bot.git
$ cd times-all-bot
$ npm i
```

デプロイ時に Slack の情報を参照するために環境変数使っています。プロジェクト直下に以下内容で`.env`を作成してください。`SLACK_SIGNING_SECRET`、`SLACK_BOT_TOKEN`は前述の Slack アプリの作成でメモした`Signing Secret`と`OAuth Token`と値です。`AGGREGATE_CHANNEL_ID`は分報の投稿を集約するチャネル（`times-all`等）の ID です。

※ チャネル ID の確認方法は[こちら](https://qiita.com/YumaInaura/items/0c4f4adb33eb21032c08)から。

```.env
SLACK_SIGNING_SECRET=<YOUR_TOKEN>
SLACK_BOT_TOKEN=<YOUR_TOKEN>
AGGREGATE_CHANNEL_ID=<CHANNEL_ID>
```

これで準備は完成です。以下コマンドで AWS Lambda にデプロイされます。

```
$ npm run deploy
```

:::message
このアプリは Serverless フレームワークを使って AWS Lambda にアプリをデプロイします。事前に AWS のクレデンシャルを`~/.aws/credentials`に設定しておいてください（[詳細](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/)）。
:::


無事デプロイが完了するとエンドポイントの URL が標準出力に出ます。
それをメモしてください。

```bash
# ...
endpoints:
  POST - https://u6d9kerzyb.execute-api.us-east-1.amazonaws.com/dev/slack/events
# ...
```

### 3. Slackアプリでのエンドポイント登録

最後にまた Slack アプリ側の設定です。
Slack アプリの管理画面からサイドバーの`Event Subscriptions`にアクセスし、`Enable Events`のチェックを ON にしてイベント購読を有効化します。

`Request URL`は先程デプロイ時に取得した Lambda のエンドポイントを設定してください。
そして`Subscribe to bot events`に`message.channels`を追加します。

![](https://i.gyazo.com/6a5d160f2eeb5d850e6b76d0cef79b34.png)

設定後、アプリを再インストールする必要があるので、`OAuth & Permissions`から必ず行いましょう。これでアプリを追加したチャネルでイベントが発生するたびに Lambda にリクエストが飛びます。

### 分報チャネル・集約チャネルへのアプリの追加

各分報チャネルと集約チャネルに先程作成したアプリをインストールすれば完了です。
**※ 必ず両方に追加する必要があるので注意**

以降は各分報チャネルに投稿した内容の全てが集約チャネルにシェアされます。

![](https://i.gyazo.com/a8f99f12f2badbf9e1d334dcba0c3a77.gif)
