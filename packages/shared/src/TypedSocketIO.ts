import type { ChatSocketEmitMap, ChatSocketListenMap } from './ChatEventMap';
import type { ConnectionInfo } from './ConnectionInfo';
import type { Socket, Server } from 'socket.io';
import type { Socket as ClientSocket } from 'socket.io-client';

export type ChatSocketType<TMessageType> = Socket<
	ChatSocketEmitMap<TMessageType>,
	ChatSocketListenMap<TMessageType>,
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	{},
	ConnectionInfo
>;

export type ChatServerType<TMessageType> = Server<
	ChatSocketEmitMap<TMessageType>,
	ChatSocketListenMap<TMessageType>,
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	{},
	ConnectionInfo
>;

export type ChatClientSocket<TMessageType> = ClientSocket<
	ChatSocketListenMap<TMessageType>,
	ChatSocketEmitMap<TMessageType>
>;
