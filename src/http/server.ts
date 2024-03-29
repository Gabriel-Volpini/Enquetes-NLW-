import fastify from "fastify";
import createPoll from "./routes/create-polls";
import getPoll from "./routes/get-poll";
import voteOnPolls from "./routes/vote-on-polls";
import cookie from "@fastify/cookie";
import { fastifyWebsocket } from "@fastify/websocket";
import pollResults from "./ws/poll-results";

const app = fastify();

app.register(cookie, {
  secret: "polls-app-nlw",
  hook: "onRequest",
});

app.register(fastifyWebsocket);

app.register(createPoll);
app.register(getPoll);
app.register(voteOnPolls);

app.register(pollResults);

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running!");
});
