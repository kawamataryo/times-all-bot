import { App, ExpressReceiver } from "@slack/bolt";
import serverlessExpress from "@vendia/serverless-express";

const aggregateChannelId = process.env.AGGREGATE_CHANNEL_ID;

const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
});

app.message(async ({ client, event }) => {
  // 集約チャネル内の投稿か、投稿の編集・削除の場合は除外
  if (
    event.channel == aggregateChannelId ||
    event.subtype == "message_changed" ||
    event.subtype == "message_deleted"
  ) {
    return;
  }

  try {
    // 投稿のpermalinkの取得
    const permalinkRes = await client.chat.getPermalink({
      channel: event.channel,
      message_ts: event.event_ts,
    });

    // 集約チャネルへの投稿
    await client.chat.postMessage({
      channel: aggregateChannelId,
      text: permalinkRes.permalink as string,
    });
  } catch (e) {
    console.error(e);
  }
});

export const handler = serverlessExpress({
  app: expressReceiver.app,
});
