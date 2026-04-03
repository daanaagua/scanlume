import { readApiJobState, writeApiJob, type WorkerEnv } from "./store";

export async function createApiJob(
  env: WorkerEnv,
  input: {
    id: string;
    userId: string;
    kind: string;
    status: string;
    payload: unknown;
    createdAt?: string;
  },
) {
  const createdAt = input.createdAt ?? new Date().toISOString();
  await writeApiJob(env, {
    id: input.id,
    userId: input.userId,
    kind: input.kind,
    status: input.status,
    payloadJson: JSON.stringify(input.payload ?? {}),
    resultJson: null,
    createdAt,
    updatedAt: createdAt,
  });

  return readApiJob(env, input.id);
}

export async function updateApiJobResult(
  env: WorkerEnv,
  input: {
    id: string;
    status: string;
    processedPages: number;
    failedPages: number;
    creditsCharged: number;
    updatedAt?: string;
  },
) {
  const current = await readApiJobState(env, input.id);
  if (!current) {
    throw new Error("api_job_not_found");
  }

  const updatedAt = input.updatedAt ?? new Date().toISOString();
  await writeApiJob(env, {
    ...current,
    status: input.status,
    resultJson: JSON.stringify({
      processedPages: input.processedPages,
      failedPages: input.failedPages,
      creditsCharged: input.creditsCharged,
    }),
    updatedAt,
  });

  return readApiJob(env, input.id);
}

export async function readApiJob(env: WorkerEnv, id: string) {
  const current = await readApiJobState(env, id);
  if (!current) {
    return null;
  }

  const result = current.resultJson ? JSON.parse(current.resultJson) as { processedPages?: number; failedPages?: number; creditsCharged?: number } : {};
  return {
    id: current.id,
    userId: current.userId,
    kind: current.kind,
    status: current.status,
    payload: JSON.parse(current.payloadJson),
    processedPages: result.processedPages ?? 0,
    failedPages: result.failedPages ?? 0,
    creditsCharged: result.creditsCharged ?? 0,
    createdAt: current.createdAt,
    updatedAt: current.updatedAt,
  };
}
