type MemoryEntry =
  | string
  | { type: string; content: string }
  | { role: string; content: string };

export class AgentMemory {
  private context: string[] = [];

  private normalize(step: unknown): string {
    if (typeof step === "string") return step;

    if (step && typeof step === "object") {
      const anyStep = step as any;

      // Common shapes used in chat/history logs
      if (typeof anyStep.type === "string" && typeof anyStep.content === "string") {
        return `[${anyStep.type}]\n${anyStep.content}`;
      }

      if (typeof anyStep.role === "string" && typeof anyStep.content === "string") {
        return `[${anyStep.role}]\n${anyStep.content}`;
      }

      try {
        return JSON.stringify(step, null, 2);
      } catch {
        // fallthrough
      }
    }

    return String(step);
  }

  add(step: MemoryEntry | unknown) {
    this.context.push(this.normalize(step));
  }

  getContext(): string {
    return this.context.join("\n");
  }

  clear() {
    this.context = [];
  }
}

export const memory = new AgentMemory();
