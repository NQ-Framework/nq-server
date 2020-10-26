import { Injectable } from '@nestjs/common';
import { Response } from '@irreal/nestjs-sse';

@Injectable()
export class ConnectorService {
  responseMap: any = {};
  add(id: string, res: Response) {
    const existing = this.get(id);
    if (existing) {
      this.close(id, existing);
    }
    this.responseMap[id] = res;
  }
  get(id: string): Response | undefined {
    if (!(id in this.responseMap)) {
      return undefined;
    }
    return this.responseMap[id] as Response;
  }

  has(id: string): boolean {
    return this.responseMap[id] !== undefined;
  }

  send(id: string, data: any) {
    const res = this.get(id);
    if (res === undefined) {
      throw new Error("Can't send data to a non existing client");
    }
    res.sse(`data: ${data}\n\n`);
  }

  close(id: string, res: Response) {
    const storedRes = this.get(id);
    if (storedRes === undefined) {
      throw new Error("Can't close connection to non existing client");
    }
    if (storedRes === res) {
    res.end();
    delete this.responseMap[id];
    }
  }
}
