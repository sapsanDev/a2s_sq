// a2s_sq.d.ts
import { Buffer } from 'buffer';

export = A2S_SQ;

declare class A2S_SQ {
  /**
   * Retrieves server information.
   * @param ip - The server IP address.
   * @param port - The server port.
   * @returns A promise that resolves to the server information.
   */
  getInfo(ip: string, port: number): Promise<ServerInfo>;

  /**
   * Retrieves player information.
   * @param ip - The server IP address.
   * @param port - The server port.
   * @returns A promise that resolves to an array of players.
   */
  getPlayers(ip: string, port: number): Promise<Player[]>;

  /**
   * Retrieves server rules.
   * @param ip - The server IP address.
   * @param port - The server port.
   * @returns A promise that resolves to an array of rules.
   */
  getRules(ip: string, port: number): Promise<Rule[]>;

  /**
   * Sends a request to the server and handles the response.
   * @param ip - The server IP address.
   * @param port - The server port.
   * @param request - The request buffer.
   * @param decoder - The function to decode the response.
   * @returns A promise that resolves to the decoded response.
   * @throws Error if it was not possible to unpack the server data or failed to retrieve server info.
   */
  private a2s_Request(ip: string, port: number, request: Buffer, decoder: (data: Buffer) => Promise<any>): Promise<any>;

  /**
   * Creates a request method for the specified request and decoder.
   * @param request - The request buffer.
   * @param decoder - The function to decode the response.
   * @returns A function that represents the request method.
   */
  private getRequestMethod(request: Buffer, decoder: (data: Buffer) => Promise<any>): (ip: string, port: number) => Promise<any>;

  /**
   * Decodes the server information response.
   * @param data - The response data.
   * @returns A promise that resolves to the decoded server information.
   * @throws Error if it was not possible to unpack the server data or failed to retrieve server info.
   */
  private infoDecoder(data: Buffer): Promise<ServerInfo>;

  /**
   * Decodes the player information response.
   * @param data - The response data.
   * @returns A promise that resolves to an array of players.
   * @throws Error if it was not possible to unpack the player data.
   */
  private playersDecoder(data: Buffer): Promise<Player[]>;

  /**
   * Decodes the server rules response.
   * @param data - The response data.
   * @returns A promise that resolves to an array of rules.
   * @throws Error if the length of the data is not equal to the number.
   */
  private rulesDecoder(data: Buffer): Promise<Rule[]>;

  /**
   * Checks the challenge response for validity.
   * @param data - The response data to check.
   * @returns A promise that resolves to the original challenge data if valid.
   * @throws Error if the data length is not 4 bytes.
   */
  private challengeCheck(data: Buffer): Promise<Buffer>;
}

interface ServerInfo {
  netver: number;
  serverName: string;
  map: string;
  gameDir: string;
  gameDesc: string;
  appID: number;
  numPlayers: number;
  maxPlayers: number;
  numBots: number;
  serverType: string;
  OS: string;
  password: number;
  vacSecured: number;
  gameVersion: string;
  EDF: number;
  port?: number;
  steamID?: Buffer;
  sourceTV?: { port: number; name: string };
  keywords?: string;
  gameID?: number;
}

interface Player {
  index: number;
  name: string;
  score: number;
  duration: number;
}

interface Rule {
  name: string;
  value: string;
}
