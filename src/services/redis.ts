import { createClient } from "redis";

let producer: Promise<ReturnType<typeof createClient>>;
let subscriber: Promise<ReturnType<typeof createClient>>;

export const hasChannelSubcribers = async (channel: string) => {
  producer ??= createClient({ url: process.env.REDIS_URL }).connect();

  const channels = await (await producer).PUBSUB_NUMSUB(channel);
  return channels[channel] ?? 0;
};

export const sendMessageToChannel = async (
  channel: string,
  message: string
) => {
  producer ??= createClient({ url: process.env.REDIS_URL }).connect();

  await (await producer).publish(channel, message);
};

export const subscribeToChannel = async (
  channel: string,
  listener: (message: string) => void
) => {
  subscriber ??= createClient({ url: process.env.REDIS_URL }).connect();

  await (await subscriber).subscribe(channel, listener);
};

export const unsubscribeFromChannel = async (
  channel: string,
  listener: (message: string) => void
) => {
  subscriber ??= createClient({ url: process.env.REDIS_URL }).connect();

  await (await subscriber).unsubscribe(channel, listener);
};
