import { z } from "zod";
import { FastifyInstance } from "fastify";
import { voting } from "../../utils/votes-pub-sub";

export default async function pollResults(app: FastifyInstance) {
  app.get(
    "/polls/:pollId/results",
    { websocket: true },
    (connection, request) => {
      connection.socket.on("message", (message: string) => {
        const getPollParams = z.object({
          pollId: z.string(),
        });

        const { pollId } = getPollParams.parse(request.params);
        voting.subscribe(pollId, (message) => {
          connection.socket.send(JSON.stringify(message));
        });
      });
    },
  );
}
