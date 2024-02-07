import fastify from "fastify";
import createPoll from "./routes/create-polls";
import getPoll from "./routes/get-poll";
import voteOnPolls from "./routes/vote-on-polls";
import cookie from "@fastify/cookie";

const app = fastify();

app.register(cookie, {
  secret: "polls-app-nlw",
  hook: "onRequest",
});

app.register(createPoll);
app.register(getPoll);
app.register(voteOnPolls);

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running!");
});
