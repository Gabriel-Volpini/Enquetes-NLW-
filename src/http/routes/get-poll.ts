import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";

export default async function getPoll(app: FastifyInstance) {
  app.get("/polls/:pollId", async (request, reply) => {
    const getPollParams = z.object({
      pollId: z.string(),
    });

    const { pollId } = getPollParams.parse(request.params);

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: { select: { id: true, title: true } },
      },
    });

    if (!poll) return reply.status(400).send({ message: "Poll not found" });

    const result = await redis.zrange(pollId, 0, -1, "WITHSCORES");

    const votes = result.reduce(
      (obj, line, idx) => {
        if (idx % 2 === 0) {
          Object.assign(obj, { [line]: Number(result[idx + 1]) });
        }

        return obj;
      },
      {} as Record<string, number>,
    );

    return reply.send({
      ...poll,
      options: poll.options.map((option) => ({
        ...option,
        score: option.id in votes ? votes[option.id] : 0,
      })),
    });
  });
}
