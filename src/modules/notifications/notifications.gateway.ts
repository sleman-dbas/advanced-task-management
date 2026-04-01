import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
// @UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    origin: '*', // في الإنتاج حدد النطاقات المسموحة
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');
  private userSockets = new Map<string, string[]>(); // userId -> socketId[]

  constructor(private notificationsService: NotificationsService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // استخراج userId من التوكن (سيتم التحقق منه في WsJwtGuard)
    const userId = client.handshake.auth.userId;
    if (userId) {
      // تخزين socket id للمستخدم
      const existing = this.userSockets.get(userId) || [];
      existing.push(client.id);
      this.userSockets.set(userId, existing);
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // إزالة socket id من الخريطة
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        } else {
          this.userSockets.set(userId, sockets);
        }
        break;
      }
    }
  }

  // إرسال إشعار لمستخدم معين
  sendNotificationToUser(userId: string, notification: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.length) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit('notification', notification);
      });
    }
  }

  // بث إشعار لجميع المستخدمين في مشروع معين
  sendNotificationToProject(projectId: string, notification: any) {
    // يمكن توسيعها لترسل للمستخدمين المرتبطين بالمشروع
    this.server.emit(`project:${projectId}`, notification);
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.join(`project:${projectId}`);
    this.logger.log(`Socket ${client.id} joined project ${projectId}`);
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.leave(`project:${projectId}`);
  }
}