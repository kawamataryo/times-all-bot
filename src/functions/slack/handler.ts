import { App, ExpressReceiver } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
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

const MESSAGE_SUBTYPE = {
  BOT: "bot_message",
  CHANGED: "message_changed",
  DELETED: "message_deleted",
};

const maybeDeleteMessage = async (params: {
  client: WebClient;
  text: string;
  channelId: string;
}) => {
  // 最新200件以内に該当する投稿が存在すれば削除
  // （編集も削除も投稿後さほど時間をあけず行うのでほぼカバーできるはず..）
  const res = await params.client.conversations.history({
    channel: params.channelId,
    inclusive: true,
    limit: 200,
  });
  if (!res.ok) return false;

  const messages = res.messages || [];
  const target = (messages as { text: string; ts: string }[])?.find((message) =>
    message.text?.includes(params.text)
  );
  if (!target) return false;

  await params.client.chat.delete({ channel: params.channelId, ts: target.ts });
  return true;
};

const maybeDeleteAndPostMessage = async (params: {
  client: WebClient;
  text: string;
  channelId: string;
}) => {
  const isOk = await maybeDeleteMessage(params);
  if (isOk) {
    await params.client.chat.postMessage({
      inclusive: true,
      channel: aggregateChannelId,
      text: params.text,
    });
  }
};

app.message(async ({ client, event }) => {
  // 集約チャネル内の投稿か、botの投稿の場合は除外
  if (
    event.channel == aggregateChannelId ||
    event.subtype == MESSAGE_SUBTYPE.BOT
  ) {
    return;
  }

  if ("previous_message" in event) {
    const previousMessagePermalink = (
      await client.chat.getPermalink({
        channel: event.previous_message.channel,
        message_ts: event.previous_message.event_ts,
      })
    ).permalink as string;

    switch (event.subtype) {
      // 集約チャネルでの編集・削除
      case MESSAGE_SUBTYPE.CHANGED:
        // 編集のみでは展開されたメッセージが変わらないので、編集前の投稿を削除してから新しい投稿を行う
        await maybeDeleteAndPostMessage({
          client,
          text: previousMessagePermalink,
          channelId: aggregateChannelId,
        });
        break;
      case MESSAGE_SUBTYPE.DELETED:
        await maybeDeleteMessage({
          client,
          text: previousMessagePermalink,
          channelId: aggregateChannelId,
        });
        break;
    }
  } else {
    const permalinkRes = await client.chat.getPermalink({
      channel: event.channel,
      message_ts: event.event_ts,
    });

    // 集約チャネルへの投稿
    await client.chat.postMessage({
      channel: aggregateChannelId,
      text: permalinkRes.permalink as string,
    });
  }
});

export const handler = serverlessExpress({
  app: expressReceiver.app,
});
