import { createRouter } from './context';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const todoRouter = createRouter()
	.middleware(async ({ ctx, next }) => {
		if (!ctx.session || !ctx.session.user) {
			throw new TRPCError({ code: 'UNAUTHORIZED' });
		}
		return next({
			ctx: {
				...ctx,
				// infers that `session` is non-nullable to downstream resolvers
				session: { ...ctx.session, user: ctx.session.user },
			},
		});
	})
	.mutation('create', {
		input: z.object({
			text: z.string(),
		}),
		async resolve({ ctx, input }) {
			try {
				return await ctx.prisma.todo.create({
					data: {
						completed: false,
						name: input.text,
						userId: ctx.session.user.id,
					},
				});
			} catch (error) {
				console.error(error);
			}
		},
	})
	.mutation('toggleTodo', {
		input: z.object({
			id: z.string(),
		}),
		async resolve({ ctx, input }) {
			try {
				const todo = await ctx.prisma.todo.findUnique({
					where: { id: input.id },
				});

				const completed = todo?.completed;

				return await ctx.prisma.todo.update({
					where: {
						id: input.id,
					},
					data: {
						completed: !completed,
					},
				});
			} catch (error) {
				console.error(error);
			}
		},
	})
	.query('getAll', {
		async resolve({ ctx }) {
			try {
				return await ctx.prisma.todo.findMany({
					where: {
						userId: ctx.session.user.id,
					},
				});
			} catch (error) {
				console.error(error);
			}
		},
	});
