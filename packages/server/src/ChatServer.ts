import { ChatService } from './ChatService';
import type { ExtendedError } from 'socket.io/dist/namespace';
import { ChatServerType, ChatSocketType, ConnectionInfo } from '@rchat/shared';
import { RoomManager } from './RoomManager';

export class ChatServer<TMessageType> {
	protected readonly roomManager;
	protected readonly service;
	protected readonly server;

	public constructor(service: ChatService<TMessageType>, server: ChatServerType<TMessageType>) {
		this.server = server;
		this.service = service;
		this.roomManager = new RoomManager<TMessageType>(server, service.getChatParticipants);
		this.initializeServer();
		this.handleMessage = this.handleMessage.bind(this);
		this.authentication = this.authentication.bind(this);
	}

	private initializeServer = () => {
		this.server.use(this.authentication);
		this.server.on('connection', this.handleConnection);
	};

	private handleConnection = async (socket: ChatSocketType<TMessageType>) => {
		socket.on('sendMessage', (message, roomIdentifier) => this.handleMessage(socket, message, roomIdentifier));
		socket.on('observeUser', (userIdentifier) => this.handleObserveUser(socket, userIdentifier));
		socket.on('unobserveUser', (userIdentifier) => this.handleUnobserveUser(socket, userIdentifier));
	};

	protected handleObserveUser = async (socket: ChatSocketType<TMessageType>, userIdentifier: string) => {
		this.roomManager.observeUser(socket, userIdentifier);
	};

	protected handleUnobserveUser = async (socket: ChatSocketType<TMessageType>, userIdentifier: string) => {
		this.roomManager.unobserveUser(socket, userIdentifier);
	};

	protected async handleMessage(socket: ChatSocketType<TMessageType>, message: TMessageType, roomIdentifier: string) {
		try {
			const broadcastChannel = await this.roomManager.broadcast(socket, roomIdentifier);

			const savedMessage = await this.service.saveMessage(socket.data as ConnectionInfo, message, roomIdentifier);

			broadcastChannel.emit('receiveMessage', savedMessage, roomIdentifier);

			return true;
		} catch (error) {
			console.error('Failed to send message');
			socket.emit('receiveError', roomIdentifier);

			return false;
		}
	}

	private async authentication(socket: ChatSocketType<TMessageType>, next: (err?: ExtendedError) => void) {
		try {
			const connectionInfo = await this.service.fetchConnectionInfo(socket.request);

			socket.data = connectionInfo;

			next();
		} catch (error) {
			console.error('Unexpected error occurred while trying to get user identifier', error);
			next(new Error('Forbidden'));
		}
	}
}
