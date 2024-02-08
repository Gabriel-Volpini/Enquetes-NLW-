import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { randomUUID } from "crypto";
import { redis } from "../../lib/redis";
import { voting } from "../../utils/votes-pub-sub";

export default async function voteOnPolls(app: FastifyInstance) {
  app.post("/polls/:pollId/vote", async (request, reply) => {
    const createPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const createPollParams = z.object({
      pollId: z.string().uuid(),
    });
    const { pollOptionId } = createPollBody.parse(request.body);
    const { pollId } = createPollParams.parse(request.params);

    let { sessionId } = request.cookies;

    if (sessionId) {
      const userPreviuosVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      });

      if (
        userPreviuosVoteOnPoll &&
        userPreviuosVoteOnPoll.pollOptionsId !== pollOptionId
      ) {
        await prisma.vote.delete({
          where: {
            id: userPreviuosVoteOnPoll.id,
          },
        });

        const votes = await redis.zincrby(
          pollId,
          -1,
          userPreviuosVoteOnPoll.pollOptionsId,
        );

        voting.publish(pollId, {
          pollOptionId: userPreviuosVoteOnPoll.pollOptionsId,
          votes: Number(votes),
        });
      } else if (userPreviuosVoteOnPoll) {
        return reply
          .status(400)
          .send({ message: "You already vote on this poll" });
      }
    } else {
      sessionId = randomUUID();

      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true,
      });
    }

    await prisma.vote.create({
      data: { sessionId, pollId, pollOptionsId: pollOptionId },
    });

    const votes = await redis.zincrby(pollId, 1, pollOptionId);

    voting.publish(pollId, {
      pollOptionId,
      votes: Number(votes),
    });

    return reply.status(201).send();
  });
}
