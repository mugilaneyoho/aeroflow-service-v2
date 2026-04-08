
import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {Server , Socket} from "socket.io"
import { NotificationService } from "../notification.service";

@WebSocketGateway({cors:{origin: 'http://localhost:3010'}})
export class NotificationGateway{
    @WebSocketServer()
    server: Server

    handleConnection(user: Socket){
        user.emit('connection', { message: 'user connected' })
    }

    handleDisconnect(user: Socket){
        user.emit(`Disconnected`, {message: 'user disconnected'})
    }

    constructor(private readonly notificationServise:NotificationService){}

    @SubscribeMessage('sendnotification')
    async handleNotification( @ConnectedSocket() user: Socket){
        const data = await this.notificationServise.findAll()
        this.server.emit('ReceiveNotification', data)
    }
}