declare class Buffer {
  toString(encoding?: string): string;
}

declare namespace NodeJS {
  interface Process {
    argv: string[];
    cwd(): string;
    env: Record<string, string | undefined>;
    exitCode?: number;
    stdout: {
      write(chunk: string): void;
    };
    stderr: {
      write(chunk: string): void;
    };
  }

  interface Require {
    (id: string): unknown;
  }
}

declare const process: NodeJS.Process;

declare module 'typescript' {
  const value: any;
  export = value;
}

declare module 'node:fs' {
  const value: any;
  export default value;
}

declare module 'node:os' {
  const value: any;
  export default value;
}

declare module 'node:path' {
  const value: any;
  export default value;
}

declare module 'node:module' {
  export const createRequire: any;
}

declare module 'node:url' {
  export const pathToFileURL: any;
}

declare module 'node:child_process' {
  export const spawn: any;
}

declare module 'node:events' {
  export const once: any;
}
