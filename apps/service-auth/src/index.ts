import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import { auth } from './routes/auth';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from 'hono/logger';

const app = new Hono<{
  Bindings: Cloudflare.Env;
}>();

app.use(logger());
app.use(requestId());
app.use(prettyJSON());
app.notFound((c) => c.json({ message: 'Not found', ok: false }, 404));

// app.use(async (c, next) => {
//   // pass hono's request-id to pino-http
//   c.env.incoming.id = c.var.requestId;

//   // map express style middleware to hono
//   await new Promise<void>((resolve) =>
//     pinoHttp()(c.env.incoming, c.env.outgoing, () => resolve())
//   );

//   c.set('logger', c.env.incoming.log);

//   await next();
// });

app.get('/', (c) => {
  console.log('aa');
  return c.text('Hello Hono!');
});

app.route('/auth', auth);

app.get(
  '/scalar',
  Scalar((c) => {
    console.log(c);
    return {
      url: '/doc',
    };
  })
);

app.get('/health', (c) => c.json({ ok: true }));

export default app;
