import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { loginFn, saveTokens } from '@/features/auth';

export const Route = createFileRoute('/login')({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<null | string>(null);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const result = await loginFn({ data: value });
        saveTokens(result.access_token, result.refresh_token);
        await navigate({ to: '/' });
      } catch (e) {
        setServerError(e instanceof Error ? e.message : 'Login failed');
      }
    },
  });

  return (
    <Container size={420} style={{ paddingTop: '10vh' }}>
      <Title ta="center">Welcome back</Title>
      <Text c="dimmed" mt="sm" size="sm" ta="center">
        Don&apos;t have an account?{' '}
        <Anchor href="#" size="sm">
          Sign up
        </Anchor>
      </Text>

      <Paper mt={30} p={30} radius="md" shadow="md" withBorder>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) =>
                !value
                  ? 'Email is required'
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                  ? 'Invalid email'
                  : undefined,
            }}
          >
            {(field) => (
              <TextInput
                error={field.state.meta.errors[0]}
                label="Email"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="you@example.com"
                required
                value={field.state.value}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onBlur: ({ value }) =>
                !value ? 'Password is required' : undefined,
            }}
          >
            {(field) => (
              <PasswordInput
                error={field.state.meta.errors[0]}
                label="Password"
                mt="md"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Your password"
                required
                value={field.state.value}
              />
            )}
          </form.Field>

          {serverError && (
            <Text c="red" mt="sm" size="sm">
              {serverError}
            </Text>
          )}

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button fullWidth loading={isSubmitting} mt="xl" type="submit">
                Sign in
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Paper>
    </Container>
  );
}
