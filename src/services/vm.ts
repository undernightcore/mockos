import Sandbox from "v8-sandbox";

export const executeUntrustedCode = async (
  code: string,
  globals: Record<string, string | Record<string, string>>
) => {
  const sandbox = new Sandbox();

  const { error, value } = await sandbox.execute({
    code: `setResult({value: (() => {${code}})()})`,
    timeout: 2000,
    globals,
  });

  await sandbox.shutdown();

  if (error) throw new Error(error.message);

  return value;
};
